"""Canonical write-message binding. Reconstruct what the wallet signed."""

from __future__ import annotations

import json
import os
import re
import time
from typing import Any

from api._redis import nonce_seen, nonce_store

CHAIN_ID = os.environ.get("GENLAYER_CHAIN_ID", "61999")
CONTRACT = os.environ.get(
    "PUBLIC_CONTRACT_ADDRESS", "0x0000000000000000000000000000000000000000"
)
ADDR_RE = re.compile(r"^0x[0-9a-fA-F]{40}$")
NONCE_RE = re.compile(r"^[1-9][0-9]{0,32}$")
PREFIX = "SHIELDLAYER_WRITE_V1"


def canonical_args(args: list[Any]) -> str:
    return json.dumps(args, separators=(",", ":"), ensure_ascii=True, sort_keys=True)


def encode_write_message(
    *,
    function: str,
    args: list[Any],
    value: str,
    nonce: str,
    contract: str,
    chain_id: str | None = None,
) -> str:
    return "\n".join(
        [
            PREFIX,
            f"chainId:{chain_id or CHAIN_ID}",
            f"contract:{contract.lower()}",
            f"fn:{function}",
            f"args:{canonical_args(args)}",
            f"value:{value}",
            f"nonce:{nonce}",
        ]
    )


def parse_and_bind(
    *,
    function: str,
    args: list[Any],
    value: int,
    address: str,
    message: str,
    nonce: str,
    contract: str | None = None,
) -> str:
    if not ADDR_RE.match(address):
        raise ValueError("ERR_INVALID_PAYLOAD")
    if not NONCE_RE.match(str(nonce)):
        raise ValueError("ERR_INVALID_NONCE")
    expected = encode_write_message(
        function=function,
        args=args,
        value=str(int(value)),
        nonce=str(nonce),
        contract=(contract or CONTRACT),
    )
    if message.strip() != expected:
        raise ValueError("ERR_MESSAGE_MISMATCH")
    key = f"{address.lower()}:{nonce}"
    if nonce_seen(key):
        raise ValueError("ERR_REPLAY")
    # Reject far-future or ancient wall-clock nonces if they look like ms timestamps
    try:
        n = int(nonce)
        now_ms = int(time.time() * 1000)
        if n > now_ms + 60_000:
            raise ValueError("ERR_INVALID_NONCE")
    except ValueError as exc:
        if str(exc) == "ERR_INVALID_NONCE":
            raise
    nonce_store(key)
    return expected


def recover(message: str, signature: str) -> str:
    from eth_account.messages import encode_defunct
    from eth_account import Account

    recovered = Account.recover_message(encode_defunct(text=message), signature=signature)
    return recovered.lower()

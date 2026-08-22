"""Minimal in-memory stub of the GenLayer SDK for offline unit tests.

Provides just enough of the ``genlayer`` surface used by
``contract/main.py`` so the contract logic can be exercised with plain
pytest without a GenLayer node. NOT for production use.
"""

import json as _json


# ---------------------------------------------------------------------------
# errors
# ---------------------------------------------------------------------------
class UserError(Exception):
    """Mirrors gl.vm.UserError."""


class _Return:
    def __init__(self, calldata):
        self.calldata = calldata


# ---------------------------------------------------------------------------
# storage primitives
# ---------------------------------------------------------------------------
u256 = int
TreeMap = dict
DynArray = list


def allow_storage(cls):
    return cls


class Address:
    def __init__(self, value="0x0000000000000000000000000000000000000000"):
        text = str(getattr(value, "as_hex", value) or "").strip()
        if not text.startswith("0x"):
            text = "0x" + text
        self.as_hex = text.lower()

    def __eq__(self, other):
        return isinstance(other, Address) and self.as_hex == other.as_hex

    def __hash__(self):
        return hash(self.as_hex)

    def __repr__(self):
        return "Address(%s)" % self.as_hex


ZERO_ADDRESS = Address()


def new_account():
    import os

    return Address("0x" + os.urandom(20).hex())


# ---------------------------------------------------------------------------
# execution context (mutable, like gl.message)
# ---------------------------------------------------------------------------
class _Message:
    def __init__(self):
        self.sender_address = ZERO_ADDRESS
        self.value = 0


message = _Message()


# ---------------------------------------------------------------------------
# nondeterministic execution stubs (fully offline / deterministic)
# ---------------------------------------------------------------------------
class _Web:
    def get(self, url):
        return None

    def render(self, url, mode="text"):
        return ""


class _Nondet:
    web = _Web()

    def exec_prompt(self, prompt, response_format=None):
        return "{}"


nondet = _Nondet()


class _Vm(UserError_ns := UserError):
    UserError = UserError
    Return = _Return

    @staticmethod
    def run_nondet_unsafe(leader_fn, validator_fn):
        try:
            result = leader_fn()
        except Exception:
            return {"status": "oracle_error", "occurred": False, "confidence": 0}
        try:
            ok = validator_fn(_Return(result))
        except Exception:
            ok = False
        return result if ok else {
            "status": "pending_manual_review",
            "occurred": False,
            "confidence": 0,
            "reason": "validator_rejected",
        }


vm = _Vm()


# ---------------------------------------------------------------------------
# evm namespace (contract_interface stub)
# ---------------------------------------------------------------------------
class _Evm:
    @staticmethod
    def contract_interface(cls):
        return cls


evm = _Evm()


# ---------------------------------------------------------------------------
# contract / decorators
# ---------------------------------------------------------------------------
class Contract:
    """Base that pre-initializes declared storage attributes (offline)."""

    def __init_subclass__(cls, **kwargs):
        super().__init_subclass__(**kwargs)
        for name, ann in list(getattr(cls, "__annotations__", {}).items()):
            origin = getattr(ann, "__origin__", None)
            if ann is TreeMap or origin is dict:
                setattr(cls, name, None)  # instance dicts set lazily below
            elif ann is DynArray or origin is list:
                setattr(cls, name, None)

    def __new__(cls, *args, **kwargs):
        obj = super().__new__(cls)
        for name, ann in getattr(cls, "__annotations__", {}).items():
            origin = getattr(ann, "__origin__", None)
            if ann in (TreeMap,) or origin is dict:
                object.__setattr__(obj, name, {})
            elif ann in (DynArray,) or origin is list:
                object.__setattr__(obj, name, [])
            elif ann is u256:
                object.__setattr__(obj, name, 0)
            elif ann is bool:
                object.__setattr__(obj, name, False)
        return obj


class _PublicWrite:
    """Descriptor supporting both @gl.public.write and @gl.public.write.payable."""

    def __init__(self, fn=None):
        self.fn = fn

    def __get__(self, obj, objtype=None):
        if obj is None:
            return self

        import functools

        return functools.partial(self.fn, obj)

    def __call__(self, *args, **kwargs):
        if self.fn is None:
            if len(args) == 1 and callable(args[0]) and not kwargs:
                self.fn = args[0]
                return self
            raise TypeError("no function bound")
        return self.fn(*args, **kwargs)

    @property
    def payable(self):
        outer = self

        class _Payable:
            def __call__(self, fn):
                return fn

        return _Payable()


class _PublicNS:
    @staticmethod
    def view(fn):
        return fn

    @property
    def write(self):
        return _PublicWrite()


public = _PublicNS()

# top-level module alias
gl_module_self = None


class _GL:
    Contract = Contract
    Address = Address
    message = message
    nondet = nondet
    vm = vm
    evm = evm
    public = public
    u256 = u256
    TreeMap = TreeMap
    DynArray = DynArray
    allow_storage = staticmethod(allow_storage)
    new_account = staticmethod(new_account)


gl_module_self = _GL()
gl = gl_module_self  # exposed for `from genlayer import *`
__all__ = [n for n in dir(gl_module_self) if not n.startswith("_")] + ["gl"]

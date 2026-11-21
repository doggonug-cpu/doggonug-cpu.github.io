#!/usr/bin/env python3
"""톡송장 3초 — Pro 라이선스 키 발급 스크립트 (로컬 전용)

키 본문: {"v":1,"id":"...","plan":"month","exp":"YYYY-MM-DD","iat":"...","sub":"..."}
키 형식: TS3.<본문 base64url>.<서명 base64url(r||s)>
서명    : ECDSA P-256 / SHA-256. 검증은 웹페이지의 license.js(공개키)가 합니다.

개인키는 이 저장소(공개 깃허브) 밖에 둡니다. 기본 위치:
    <워크스페이스>/projects/toksongjang-license/license_private_key.pem
깃허브에는 절대 올리지 마세요. (저장소 .gitignore 에 *.pem 이 걸려 있습니다.)

사용 예
    # 1) 처음 한 번: 개인키 만들기 (이미 있으면 아무 것도 하지 않음)
    python3 pages-repo/kakao-invoice/scripts/generate_license_key.py --init

    # 2) 주문 확인 후 키 발급 (10초)
    python3 pages-repo/kakao-invoice/scripts/generate_license_key.py \
        --plan month --email buyer@example.com

    # 3개월권 / 직접 일수 지정
    python3 ... --plan quarter --email buyer@example.com
    python3 ... --days 14 --email buyer@example.com

    # 3) 발급한 키 검증
    python3 ... --verify "TS3.xxx.yyy"

    # 4) license.js 의 공개키와 개인키가 짝이 맞는지 확인
    python3 ... --check
"""
from __future__ import annotations

import argparse
import base64
import csv
import datetime as dt
import json
import os
import pathlib
import sys
from typing import Any

from cryptography.exceptions import InvalidSignature
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives.asymmetric.utils import decode_dss_signature, encode_dss_signature

REPO_DIR = pathlib.Path(__file__).resolve().parent.parent
LICENSE_JS = REPO_DIR / "license.js"
DEFAULT_KEY = REPO_DIR.parents[1] / "projects" / "toksongjang-license" / "license_private_key.pem"

PLAN_DAYS = {"month": 30, "quarter": 90, "half": 180, "trial": 7}
KST = dt.timezone(dt.timedelta(hours=9))


def b64u(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def b64u_decode(text: str) -> bytes:
    pad = "=" * (-len(text) % 4)
    return base64.urlsafe_b64decode(text + pad)


def key_path(args: argparse.Namespace) -> pathlib.Path:
    if args.key:
        return pathlib.Path(args.key).expanduser()
    env = os.environ.get("TS3_PRIVATE_KEY")
    return pathlib.Path(env).expanduser() if env else DEFAULT_KEY


def load_or_create(path: pathlib.Path, create: bool) -> ec.EllipticCurvePrivateKey:
    if path.exists():
        return serialization.load_pem_private_key(path.read_bytes(), password=None)
    if not create:
        sys.exit(
            f"개인키가 없습니다: {path}\n"
            "처음이라면 --init 으로 만들어 주세요. (저장소 밖 경로에만 만듭니다)"
        )
    path.parent.mkdir(parents=True, exist_ok=True)
    key = ec.generate_private_key(ec.SECP256R1())
    pem = key.private_bytes(
        serialization.Encoding.PEM,
        serialization.PrivateFormat.PKCS8,
        serialization.NoEncryption(),
    )
    path.write_bytes(pem)
    try:
        path.chmod(0o600)
    except OSError:
        pass
    print(f"개인키를 만들었습니다: {path}")
    print("  · 이 파일은 공개 저장소에 절대 올리지 마세요. 잃어버리면 기존 키를 새로 발급해야 합니다.\n")
    return key


def public_snippet(key: ec.EllipticCurvePrivateKey) -> str:
    nums = key.public_key().public_numbers()
    return (
        "  var PUBLIC_KEY = {\n"
        f"    x: '{format(nums.x, '064x')}',\n"
        f"    y: '{format(nums.y, '064x')}'\n"
        "  };"
    )


def embedded_public_key() -> tuple[int, int] | None:
    if not LICENSE_JS.exists():
        return None
    import re

    text = LICENSE_JS.read_text(encoding="utf-8")
    mx = re.search(r"x:\s*'([0-9a-fA-F]{64})'", text)
    my = re.search(r"y:\s*'([0-9a-fA-F]{64})'", text)
    if not mx or not my:
        return None
    return int(mx.group(1), 16), int(my.group(1), 16)


def today_kst() -> dt.date:
    return dt.datetime.now(KST).date()


def parse_date(text: str) -> dt.date:
    return dt.date.fromisoformat(text)


def build_payload(args: argparse.Namespace) -> dict[str, Any]:
    start = parse_date(args.start) if args.start else today_kst()
    days = int(args.days) if args.days else PLAN_DAYS.get(args.plan, 30)
    if days < 1 or days > 3650:
        sys.exit("--days 는 1~3650 사이여야 합니다.")
    exp = start + dt.timedelta(days=days)
    now = dt.datetime.now(KST)
    key_id = args.id or "TS3-" + now.strftime("%Y%m%d-%H%M%S")
    payload: dict[str, Any] = {
        "v": 1,
        "id": key_id,
        "plan": args.plan if args.days is None else "custom",
        "exp": exp.isoformat(),
        "iat": start.isoformat(),
    }
    if args.email:
        payload["sub"] = args.email.strip()
    elif args.sub:
        payload["sub"] = args.sub.strip()
    return payload


def issue(key: ec.EllipticCurvePrivateKey, payload: dict[str, Any]) -> str:
    body = json.dumps(payload, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    encoded = b64u(body)
    der = key.sign(encoded.encode("ascii"), ec.ECDSA(hashes.SHA256()))
    r, s = decode_dss_signature(der)
    return f"TS3.{encoded}.{b64u(r.to_bytes(32, 'big') + s.to_bytes(32, 'big'))}"


def verify(key: ec.EllipticCurvePrivateKey, token: str) -> dict[str, Any]:
    parts = token.strip().split(".")
    if len(parts) != 3 or parts[0] != "TS3":
        sys.exit("키 형식이 아닙니다. TS3.<본문>.<서명> 모양이어야 합니다.")
    body = json.loads(b64u_decode(parts[1]).decode("utf-8"))
    sig = b64u_decode(parts[2])
    if len(sig) != 64:
        sys.exit(f"서명 길이가 {len(sig)}바이트입니다(64바이트여야 함).")
    r = int.from_bytes(sig[:32], "big")
    s = int.from_bytes(sig[32:], "big")
    der = encode_dss_signature(r, s)
    try:
        key.public_key().verify(der, parts[1].encode("ascii"), ec.ECDSA(hashes.SHA256()))
    except InvalidSignature:
        sys.exit("서명이 맞지 않습니다(변조되었거나 다른 키로 만든 키).")
    return body


def log_issue(key_path_value: pathlib.Path, payload: dict[str, Any], token: str) -> None:
    ledger = key_path_value.parent / "issued_keys.csv"
    new_file = not ledger.exists()
    with ledger.open("a", newline="", encoding="utf-8") as handle:
        writer = csv.writer(handle)
        if new_file:
            writer.writerow(["발급일시", "키ID", "기간", "만료일", "대상", "키"])
        writer.writerow([
            dt.datetime.now(KST).strftime("%Y-%m-%d %H:%M:%S"),
            payload["id"],
            payload["plan"],
            payload["exp"],
            payload.get("sub", ""),
            token,
        ])
    print(f"발급 대장에 한 줄 기록했습니다: {ledger}")


def main() -> None:
    parser = argparse.ArgumentParser(description="톡송장 3초 Pro 라이선스 키 발급·검증")
    parser.add_argument("--key", help="개인키 경로 (기본: projects/toksongjang-license/license_private_key.pem)")
    parser.add_argument("--init", action="store_true", help="개인키가 없으면 새로 만들고 공개키 스니펫을 보여 줌")
    parser.add_argument("--pub", action="store_true", help="공개키 JS 스니펫만 출력")
    parser.add_argument("--check", action="store_true", help="license.js 의 공개키와 개인키 짝 확인")
    parser.add_argument("--plan", choices=sorted(PLAN_DAYS), default="month", help="기간 (기본 month=30일)")
    parser.add_argument("--days", type=int, help="기간을 일수로 직접 지정")
    parser.add_argument("--start", help="시작일 YYYY-MM-DD (기본: 오늘, 한국 시간)")
    parser.add_argument("--email", help="구매자 이메일(키 대상 표기)")
    parser.add_argument("--sub", help="대상 표기 직접 지정(입금자명 등)")
    parser.add_argument("--id", help="키 ID 직접 지정")
    parser.add_argument("--verify", metavar="TOKEN", help="이미 발급한 키를 검증")
    parser.add_argument("--no-log", action="store_true", help="발급 대장에 기록하지 않음")
    args = parser.parse_args()

    path = key_path(args)

    if args.init or not args.verify:
        key = load_or_create(path, create=args.init)
    else:
        key = load_or_create(path, create=False)

    if args.pub:
        print(public_snippet(key))
        return

    if args.check:
        mine = key.public_key().public_numbers()
        embedded = embedded_public_key()
        if embedded is None:
            sys.exit(f"license.js 에서 공개키를 찾지 못했습니다: {LICENSE_JS}")
        if (mine.x, mine.y) == embedded:
            print("짝이 맞습니다 — license.js 의 공개키가 이 개인키의 공개키와 같습니다.")
            return
        sys.exit(
            "짝이 다릅니다! license.js 의 PUBLIC_KEY 를 이 개인키의 공개키로 바꿔야 합니다:\n"
            + public_snippet(key)
        )

    if args.verify:
        payload = verify(key, args.verify)
        today = today_kst()
        exp = parse_date(payload["exp"])
        state = "사용 가능" if today <= exp else "만료"
        print(json.dumps({**payload, "오늘": today.isoformat(), "상태": state}, ensure_ascii=False, indent=2))
        return

    if args.init:
        print("공개키 스니펫 (license.js 의 PUBLIC_KEY 와 같아야 합니다):")
        print(public_snippet(key))
        return

    payload = build_payload(args)
    token = issue(key, payload)
    today = today_kst()
    exp = parse_date(payload["exp"])
    print("톡송장 3초 Pro 라이선스 키")
    print(f"  기간      : {payload['plan']} ({(exp - today).days}일 남음)")
    print(f"  만료일    : {payload['exp']}")
    print(f"  대상      : {payload.get('sub', '(없음)')}")
    print(f"  키 ID     : {payload['id']}")
    print("")
    print(token)
    print("")
    print("구매자에게는 위 키 한 줄을 그대로 보내면 됩니다(사이트 요금·이용권 영역에 붙여넣기).")
    if not args.no_log:
        log_issue(path, payload, token)


if __name__ == "__main__":
    main()

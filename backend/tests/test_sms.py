import sms


class FakeResponse:
    def __init__(self, payload, status_code=200):
        self.payload = payload
        self.status_code = status_code
        self.text = str(payload)

    def raise_for_status(self):
        if self.status_code >= 400:
            raise RuntimeError(self.text)

    def json(self):
        return self.payload


def test_msg91_uses_configured_otp_template_without_overriding_its_sender(monkeypatch):
    monkeypatch.setenv("MSG91_AUTH_KEY", "test-key")
    monkeypatch.setenv("MSG91_TEMPLATE_ID", "template-id")
    monkeypatch.delenv("MSG91_SENDER_ID", raising=False)
    captured = {}

    def post(*args, **kwargs):
        captured.update(kwargs)
        return FakeResponse({"type": "success", "message": "msg91-request-id"})

    monkeypatch.setattr(sms.httpx, "post", post)

    receipt = sms._send_msg91("919876543210", "123456")

    assert receipt == {"request_id": "msg91-request-id"}
    assert captured["json"]["template_id"] == "template-id"
    assert captured["json"]["mobile"] == "919876543210"
    assert "sender" not in captured["json"]


def test_msg91_rejects_non_success_response(monkeypatch):
    monkeypatch.setenv("MSG91_AUTH_KEY", "test-key")
    monkeypatch.setenv("MSG91_TEMPLATE_ID", "template-id")
    monkeypatch.setattr(sms.httpx, "post", lambda *args, **kwargs: FakeResponse({"type": "error", "message": "Template disabled"}))

    try:
        sms._send_msg91("919876543210", "123456")
    except RuntimeError as error:
        assert "Template disabled" in str(error)
    else:
        raise AssertionError("MSG91 errors must not be reported to the UI as sent")

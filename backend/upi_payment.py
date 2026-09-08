from __future__ import annotations

import os
from urllib.parse import quote


def generate_upi_link(amount: float, order_id: str, merchant_name: str = None) -> str:
    """
    Generate UPI deep link for payment.

    Args:
        amount: Amount in INR
        order_id: Unique order ID for transaction reference
        merchant_name: Merchant name to display

    Returns:
        UPI deep link that opens user's UPI app
    """
    upi_id = os.environ.get("UPI_ID", "usurkhi8@oksbi")
    merchant = merchant_name or os.environ.get("UPI_MERCHANT_NAME", "Paws & Whiskers India")

    # UPI URL format: upi://pay?pa=<UPI_ID>&pn=<Merchant Name>&am=<Amount>&tn=<Transaction Note>&cu=INR
    upi_params = {
        "pa": upi_id,  # Payee address (UPI ID)
        "pn": merchant,  # Payee name
        "am": f"{amount:.2f}",  # Amount
        "tn": f"Order {order_id}",  # Transaction note
        "cu": "INR",  # Currency
    }

    # Build UPI URL
    param_string = "&".join([f"{key}={quote(str(value))}" for key, value in upi_params.items()])
    upi_link = f"upi://pay?{param_string}"

    return upi_link


def generate_upi_qr_data(amount: float, order_id: str, merchant_name: str = None) -> str:
    """
    Generate UPI QR code data string.
    Same as UPI link but can be encoded as QR code.
    """
    return generate_upi_link(amount, order_id, merchant_name)

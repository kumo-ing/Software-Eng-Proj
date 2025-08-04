import smtplib
import random


EMAIL_ADDRESS = "projmdp@gmail.com"
EMAIL_PASSWORD = "pvpf tsis izpg aank"

def generate_otp():
    return str(random.randint(100000, 999999))

def send_email(receiver_email, subject, body):
    subject = subject
    body = body
    message = f"Subject: {subject}\n\n{body}"

    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as smtp:
        smtp.login(EMAIL_ADDRESS, EMAIL_PASSWORD)
        smtp.sendmail(EMAIL_ADDRESS, receiver_email, message)

if __name__ == "__main__":
    for i in range(5):
        send_email(EMAIL_ADDRESS, "This is a spam " + str(i + 1), "I created a spam bot.")

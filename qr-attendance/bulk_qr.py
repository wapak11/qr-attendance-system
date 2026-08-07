import qrcode
import os

# List your students here for your research.
# IMPORTANT: these IDs MUST match the keys in server.js -> studentDatabase,
# otherwise the scanner will log them as "Unknown Student".
students = [
    "MOD-04051-BLCK"        #jm
    # to export qr codes, run this command in terminal: python bulk_qr.py
]

# Create a folder for the images
if not os.path.exists('student_qrs'):
    os.makedirs('student_qrs')

for student_id in students:
    # Generate the QR Code
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(student_id)
    qr.make(fit=True)

    # Save as an image
    img = qr.make_image(fill_color="black", back_color="white")
    img.save(f"student_qrs/{student_id}.png")
    print(f"Generated QR for: {student_id}")

print("\n✅ All QR codes are ready in the 'student_qrs' folder!")

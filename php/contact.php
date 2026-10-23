<?php

header("Content-Type: application/json; charset=UTF-8");

function respond(int $status, bool $success, string $message): void
{
    http_response_code($status);
    echo json_encode([
        "success" => $success,
        "message" => $message
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    respond(405, false, "Metode request tidak valid.");
}

$name = trim($_POST["name"] ?? "");
$email = trim($_POST["email"] ?? "");
$subject = trim($_POST["subject"] ?? "");
$message = trim($_POST["message"] ?? "");

if (
    $name === "" ||
    mb_strlen($name) > 100 ||
    !filter_var($email, FILTER_VALIDATE_EMAIL) ||
    mb_strlen($email) > 254 ||
    $subject === "" ||
    mb_strlen($subject) > 200 ||
    $message === "" ||
    mb_strlen($message) > 10000
) {
    respond(422, false, "Periksa kembali data yang Anda masukkan.");
}

$configPath = __DIR__ . "/mail-config.php";
$autoloadPath = __DIR__ . "/../vendor/autoload.php";

if (!is_file($configPath) || !is_file($autoloadPath)) {
    respond(
        503,
        false,
        "Pengiriman email belum dikonfigurasi. Salin php/mail-config.example.php menjadi php/mail-config.php, isi pengaturan SMTP, lalu jalankan composer install."
    );
}

$mailConfig = require $configPath;
$requiredConfig = ["host", "port", "username", "password", "from_email", "from_name", "recipient"];

if (!is_array($mailConfig)) {
    respond(503, false, "Format php/mail-config.php tidak valid.");
}

foreach ($requiredConfig as $key) {
    if (!isset($mailConfig[$key]) || trim((string) $mailConfig[$key]) === "") {
        respond(503, false, "Pengaturan SMTP belum lengkap. Periksa php/mail-config.php.");
    }
}

if (
    filter_var($mailConfig["port"], FILTER_VALIDATE_INT, [
        "options" => ["min_range" => 1, "max_range" => 65535]
    ]) === false ||
    !filter_var($mailConfig["from_email"], FILTER_VALIDATE_EMAIL) ||
    !filter_var($mailConfig["recipient"], FILTER_VALIDATE_EMAIL)
) {
    respond(503, false, "Alamat email pengirim atau penerima pada konfigurasi tidak valid.");
}

require $autoloadPath;

$mail = new PHPMailer\PHPMailer\PHPMailer(true);

try {
    $mail->isSMTP();
    $mail->Host = $mailConfig["host"];
    $mail->Port = (int) $mailConfig["port"];
    $mail->Timeout = 15;
    $mail->SMTPAuth = true;
    $mail->Username = $mailConfig["username"];
    $mail->Password = $mailConfig["password"];
    $mail->SMTPSecure = $mail->Port === 465
        ? PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_SMTPS
        : PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_STARTTLS;
    $smtpCaBundle = __DIR__ . "/smtp-ca.pem";
    if (is_file($smtpCaBundle)) {
        $mail->SMTPOptions = [
            "ssl" => [
                "cafile" => $smtpCaBundle,
                "verify_peer" => true,
                "verify_peer_name" => true,
                "allow_self_signed" => false
            ]
        ];
    }
    $mail->CharSet = PHPMailer\PHPMailer\PHPMailer::CHARSET_UTF8;
    $mail->setFrom($mailConfig["from_email"], $mailConfig["from_name"]);
    $mail->addAddress($mailConfig["recipient"]);
    $mail->addReplyTo($email, $name);
    $mail->Subject = "Portfolio: " . $subject;
    $mail->Body = "Nama: {$name}\nEmail: {$email}\nSubjek: {$subject}\n\nPesan:\n{$message}";
    $mail->AltBody = $mail->Body;
    $mail->send();
} catch (PHPMailer\PHPMailer\Exception $error) {
    $errorInfo = $mail->ErrorInfo;
    error_log("Portfolio contact email failed: " . $errorInfo);

    if (
        stripos($errorInfo, "certificate verify failed") !== false ||
        stripos($errorInfo, "unable to get local issuer certificate") !== false
    ) {
        respond(
            502,
            false,
            "Koneksi SMTP ditolak karena sertifikat TLS tidak dipercaya oleh PHP. Periksa CA bundle pada php.ini atau php/smtp-ca.pem, lalu restart Apache. Jangan menonaktifkan verifikasi TLS."
        );
    }

    if (stripos($errorInfo, "could not authenticate") !== false) {
        respond(
            502,
            false,
            "Gmail menolak login SMTP. Pastikan username adalah alamat Gmail lengkap dan password adalah App Password Google 16 karakter tanpa spasi, bukan password Gmail biasa. Simpan perubahan pada php/mail-config.php lalu coba lagi."
        );
    }

    respond(502, false, "Email gagal dikirim. Periksa pengaturan SMTP dan coba lagi.");
}

respond(200, true, "Email berhasil dikirim. Terima kasih sudah menghubungi saya!");

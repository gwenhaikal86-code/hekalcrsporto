<?php
/*
 * Koneksi database portfolio.
 * Sesuaikan nama database jika diperlukan.
 */

$host = "localhost";
$user = "root";
$password = "";
$database = "portfolio_db";

$conn = mysqli_connect($host, $user, $password, $database);

if (!$conn) {
    die("Koneksi database gagal: " . mysqli_connect_error());
}

mysqli_set_charset($conn, "utf8mb4");
?>

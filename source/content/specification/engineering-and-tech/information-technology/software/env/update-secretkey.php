<?php
error_reporting(E_ALL);
ini_set('display_errors', '1');
include('config.php');
//from https://stackoverflow.com/questions/13640109/how-to-prevent-browser-cache-for-php-site
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Cache-Control: post-check=0, pre-check=0", false);
header("Pragma: no-cache");
// from https://stackoverflow.com/questions/14467673/enable-cors-in-htaccess
// Allow from any origin
if (isset($_SERVER['HTTP_ORIGIN'])) {
    // should do a check here to match $_SERVER['HTTP_ORIGIN'] to a
    // whitelist of safe domains
    header("Access-Control-Allow-Origin: *");
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Max-Age: 86400');    // cache for 1 day
}
// Access-Control headers are received during OPTIONS requests
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {

    if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_METHOD']))
        header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");

    if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']))
        header("Access-Control-Allow-Headers: {$_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']}");

}
function getParam($name) {
    if (isset($_GET[$name])) {
        return $_GET[$name];
    } else {
        if (isset($_POST[$name])) {
            return $_POST[$name];
        }
        else
        {
            return '';
        }
    }
}
include('active.fracturedb.php');
function eiteHashSecret($secretkey) {
    return password_hash($secretkey, PASSWORD_DEFAULT);
}
$database=new FractureDB($mysqlTablePrefix.'eite_node', $mysqlUser, $mysqlPassword, $mysqlServer);
$publicId=getParam('publicId');
$oldKey=getParam('oldKey');
$newKey=getParam('newKey');
$newKeyConfirm=getParam('newKeyConfirm');
if($oldKey === '') {
    echo '<!DOCTYPE html>
    <html lang="en">
    <head>
    <meta charset="utf-8" />
    <meta content="width=device-width, height=device-height, user-scalable=yes" name="viewport">
    <link href="accounts.css" rel="stylesheet" type="text/css">
    <style type="text/css" media="all">table,tr,td{border:1px dotted maroon;}"</style>
    <title>Change Password</title>
    </head>
    <body><a href="/">← Home</a><br><br>';
    echo '<form method="post" action="update-secretkey.php"><label for="publicId">User name: </label> <input type="text" placeholder="my-login-id" name="publicId" id="publicId" required><br><label for="oldKey">Old password: </label> <input type="password" name="oldKey" id="oldKey" required><br><label for="newKey">New password: </label> <input type="password" name="newKey" id="newKey" required><br><label for="newKeyConfirm">Retype new password to confirm: </label> <input type="password" name="newKeyConfirm" id="newKeyConfirm" required><br><input type="submit" value="Change password"></form>';
    echo '</body></html>';
}
else {
    $userData=$database->getRow("idxPerson", "publicId", $publicId);
    if ($userData != null) {
        if (password_verify($oldKey, $userData["hashedSecretKey"])) {
            if($newKey === $newKeyConfirm) {
                $database->setField('idxPerson', 'hashedSecretKey', eiteHashSecret($newKey), $userData['id']);
                echo '<!DOCTYPE html>
                <html lang="en">
                <head>
                <meta charset="utf-8" />
                <meta content="width=device-width, height=device-height, user-scalable=yes" name="viewport">
                <link href="accounts.css" rel="stylesheet" type="text/css">
                <style type="text/css" media="all">table,tr,td{border:1px dotted maroon;}"</style>
                <title>Change Password</title>
                </head>
                <body><br><br>
                <p>Updated password!</p><br>
                <p><a href="/">→ Log in with the new password at home page</a></p>
                </body>
                </html>';
            }
            else {
                http_response_code(400);
                echo '<!DOCTYPE html>
                <html lang="en">
                <head>
                <meta charset="utf-8" />
                <meta content="width=device-width, height=device-height, user-scalable=yes" name="viewport">
                <link href="accounts.css" rel="stylesheet" type="text/css">
                <style type="text/css" media="all">table,tr,td{border:1px dotted maroon;}"</style>
                <title>Change Password</title>
                </head>
                <body>
                <p>ERROR: The two new passwords do not match! <a href="javascript:history.back()">Back</a></p>
                </body>
                </html>';
            }
        } else {
            http_response_code(403);
            echo '<!DOCTYPE html>
            <html lang="en">
            <head>
            <meta charset="utf-8" />
            <meta content="width=device-width, height=device-height, user-scalable=yes" name="viewport">
            <link href="accounts.css" rel="stylesheet" type="text/css">
            <style type="text/css" media="all">table,tr,td{border:1px dotted maroon;}"</style>
            <title>Change Password</title>
            </head>
            <body><a href="/">← Home</a><br><br>
            <p>ERROR: Incorrect password!</p>
            </body>
            </html>';
        }
    } else {
        http_response_code(403);
        echo '<!DOCTYPE html>
        <html lang="en">
        <head>
        <meta charset="utf-8" />
        <meta content="width=device-width, height=device-height, user-scalable=yes" name="viewport">
        <link href="accounts.css" rel="stylesheet" type="text/css">
        <style type="text/css" media="all">table,tr,td{border:1px dotted maroon;}"</style>
        <title>Change Password</title>
        </head>
        <body><a href="/">← Home</a><br><br>
        <p>ERROR: Unknown user.</p>
        </body>
        </html>';
    }
}

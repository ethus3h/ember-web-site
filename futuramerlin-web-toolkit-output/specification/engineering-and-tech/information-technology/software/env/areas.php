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
$database=new FractureDB($mysqlTablePrefix.'eite_node2', $mysqlUser, $mysqlPassword, $mysqlServer);
$closeByJavascript=getParam('closeByJavascript');
echo '<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta content="width=device-width, height=device-height, user-scalable=yes" name="viewport">
<link href="accounts.css" rel="stylesheet" type="text/css">
<script src="sorttable.js"></script>
<style type="text/css" media="all">table,tr,td{border:1px dotted maroon;}"</style>
<title>Available ZIP Codes</title>
</head>
<body class="noBodyBackground"><h1>Available ZIP Codes</h1><a href="';
if ($closeByJavascript === 'true') {
    echo '#" onClick="javascript:window.close(); window.location.href = \'/\'; return false';
} else {
    echo '/';
}
echo '">← Home</a><br><br>
<!-- <p>Click column headers to sort the table.</p> -->
<table class="sortable"><thead><tr><th>ZIP Code</th><th>City</th>';
echo '<th><!-- Area of country (state/province/subdivision) -->State</th><!-- <th>Country</th> -->';
echo '</tr></thead>
<tbody>';
$resultsArray=$database->getTable('ZIPCodes');
$counter = 0;
while ($counter <= (count($resultsArray) - 1)) {
    $dataRow=$resultsArray[$counter];
    echo '<tr><td>'.$dataRow['zipcode'].'</td><td>'.$dataRow['town'].'</td>';
    echo '<td>'.$dataRow['areaOfCountry'].'</td>';
    #echo '<td>'.$dataRow['country'].'</td>';
    echo '</tr>';
    $counter++;
}
echo '</tbody></table></body></html>';

<?php

// Set response type
header('Content-Type: application/json');

// Get session ID from custom header
$sessionId = $_SERVER['HTTP_X_SESSION_ID'] ?? '';

// Read the JSON input
$input = json_decode(file_get_contents('php://input'), true);

// Example: log input or use it
if ($input) {
    // Process the payment logic here (mock or actual logic)
$payment_access_key  = 'a87ff679a2f3e71d9181a67b7542122c';
$encoded_data        = base64_encode($payment_access_key);
$endpoint            = 'https://payport.novalnet.de/v2/payment';
$headers = [
	'Content-Type:application/json',
	'Charset:utf-8', 
	'Accept:application/json', 
	'X-NN-Access-Key:' . $encoded_data, 
];
$data = [];
$data['merchant'] = [
	'signature' => '7ibc7ob5|tuJEH3gNbeWJfIHah||nbobljbnmdli0poys|doU3HJVoym7MQ44qf7cpn7pc', 
	'tariff'    => '10004', 
];
$data['customer'] = [
	'first_name'  => 'Max',
	'last_name'   => 'Mustermann', 
	'gender'   	  => 'u', 
	'email'       => 'abiraj_s@novalnetsolutions.com', 
	'customer_ip' => '192.168.2.179',
	'customer_no' => '20',
	'billing'     => [
		'house_no'     => '2',
		'street'       => 'Musterstr',
		'city'         => 'Musterhausen',
		'zip'          => '12345',
		'country_code' => 'DE'
	]    
];
$data['transaction'] = [
	'payment_type'     => 'GOOGLEPAY',
	'amount'           => '1000',
	'currency'         => 'EUR',
	'order_no'         => '100',
	'test_mode'        => '1',
	'create_token'     => 1,
	'return_url'     => '/var/www/abiraj_s/QuickTestV2/GOOGLEPAY.php',
	'error_return_url'     => '/var/www/abiraj_s/QuickTestV2/GOOGLEPAY.php',
	'payment_data'     => [        
		'wallet_token' => 'RcBwwac-RwwXVTw-VmiLHRDNHDwwcagmTwLFPcFwVgDXVTJwDkcJR16q16q08iLXF' 
	]   
];

// Custom Data
$data['custom'] = [
	'lang'      => 'EN',
];

// Convert the array to JSON string
$json_data = json_encode($data);
$response = send_request($json_data, $endpoint, $headers);

echo"<pre>";print_r($response);
exit;

function send_request($data, $url, $headers) {
    $curl = curl_init();
    curl_setopt($curl, CURLOPT_URL, $url);
    curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($curl, CURLOPT_POST, true);
    curl_setopt($curl, CURLOPT_POSTFIELDS, $data);
    curl_setopt($curl, CURLOPT_HTTPHEADER, $headers);
    $result = curl_exec($curl);
    if (curl_errno($curl)) {
        echo 'Request Error:' . curl_error($curl);
        return $result;
    }
    curl_close($curl);
    return $result;
}
    // Example response
    echo json_encode([
        'success' => true,
        'message' => 'Payment processed successfully',
        'received_session_id' => $sessionId,
        'received_data' => $input
    ]);
} else {
    echo json_encode([
        'success' => false,
        'message' => 'Invalid input'
    ]);
}
?>

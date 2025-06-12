<?php

// Set response type
header('Content-Type: application/json');

// Get session ID from custom header
$sessionId = $_SERVER['HTTP_X_SESSION_ID'] ?? '';

// Read the JSON input
$input = json_decode(file_get_contents('php://input'), true);

// Example: log input or use it
if ($input) {
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

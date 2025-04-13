<?php
// events-api.php - Endpoint to fetch events data for React frontend

// Database connection
require_once 'db.php'; // Assuming this file has your DB connection as $conn

// Set CORS headers to allow requests from any origin
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Error handling function
function sendError($message, $code = 400) {
    http_response_code($code);
    echo json_encode(['success' => false, 'message' => $message]);
    exit();
}

// Get events data
try {
    // Fetch all event groups and their events
    $query = "
        SELECT 
            eg.id as group_id,
            eg.name as category,
            e.id,
            e.title,
            e.description,
            e.image,
            e.created_at
        FROM 
            event_groups eg
        LEFT JOIN 
            events e ON eg.id = e.event_group_id
        ORDER BY 
            eg.position ASC,
            e.created_at DESC
    ";
    
    $result = $conn->query($query);
    
    if (!$result) {
        throw new Exception("Database error: " . $conn->error);
    }
    
    $events = [];
    $eventId = 1; // Starting ID for frontend
    
    while ($row = $result->fetch_assoc()) {
        // Skip rows where the event doesn't exist (from LEFT JOIN)
        if (is_null($row['id'])) {
            continue;
        }
        
        // Format image URL
        $imageUrl = !empty($row['image']) 
            ? '/uploads/events/' . $row['image'] 
            : null;
            
        // Add event to array
        $events[] = [
            'id' => (string)$eventId++, // Convert to string to match your React component
            'title' => $row['title'],
            'image' => $imageUrl,
            'description' => $row['description'],
            'details' => $row['description'], // You might want to add a 'details' field to your database
            'category' => $row['category'],
            // Add any other fields your frontend expects
        ];
    }
    
    // Send the formatted events data
    echo json_encode([
        'success' => true,
        'events' => $events
    ]);
    
} catch (Exception $e) {
    sendError($e->getMessage(), 500);
}
?>
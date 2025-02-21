<?php
include 'db.php';

// Set up uploads directory for events
$uploadsDir = __DIR__ . '/uploads/events/';
if (!file_exists($uploadsDir)) {
    mkdir($uploadsDir, 0755, true);
}

// Handle the request based on the action parameter
$action = isset($_GET['action']) ? $_GET['action'] : 
         (isset($_POST['action']) ? $_POST['action'] : '');

switch ($action) {
    case 'getEventGroups':
        getEventGroups();
        break;
    case 'addEventGroup':
        addEventGroup();
        break;
    case 'updateEventGroup':
        updateEventGroup();
        break;
    case 'updateEventGroupPosition':
        updateEventGroupPosition();
        break;
    case 'deleteEventGroup':
        deleteEventGroup();
        break;
    case 'addEvent':
        addEvent();
        break;
    case 'updateEvent':
        updateEvent();
        break;
    case 'deleteEvent':
        deleteEvent();
        break;
    default:
        sendJsonResponse(['success' => false, 'message' => 'Invalid action'], 400);
}

// Get all event groups with their events
function getEventGroups() {
    global $conn;
    
    try {
        // Get all event groups ordered by position
        $groupsQuery = "SELECT * FROM event_groups ORDER BY position ASC";
        $groupsResult = $conn->query($groupsQuery);
        
        if (!$groupsResult) {
            throw new Exception("Database error: " . $conn->error);
        }
        
        $eventGroups = [];
        
        while ($group = $groupsResult->fetch_assoc()) {
            // Get all events for each group
            $eventsQuery = "SELECT * FROM events WHERE event_group_id = ? ORDER BY id DESC";
            $stmt = $conn->prepare($eventsQuery);
            $stmt->bind_param("i", $group['id']);
            $stmt->execute();
            $eventsResult = $stmt->get_result();
            
            if (!$eventsResult) {
                throw new Exception("Database error: " . $conn->error);
            }
            
            $events = [];
            while ($event = $eventsResult->fetch_assoc()) {
                $events[] = $event;
            }
            
            $group['events'] = $events;
            $eventGroups[] = $group;
        }
        
        sendJsonResponse(['success' => true, 'eventGroups' => $eventGroups]);
    } catch (Exception $e) {
        sendJsonResponse(['success' => false, 'message' => $e->getMessage()], 500);
    }
}

// Add new event group
function addEventGroup() {
    global $conn;
    
    try {
        // Validate input
        if (!isset($_POST['name']) || empty($_POST['name'])) {
            throw new Exception("Group name is required");
        }
        
        $name = $_POST['name'];
        $position = isset($_POST['position']) && is_numeric($_POST['position']) ? 
                   (int)$_POST['position'] : 1;
        
        // Insert new event group
        $query = "INSERT INTO event_groups (name, position) VALUES (?, ?)";
        $stmt = $conn->prepare($query);
        $stmt->bind_param("si", $name, $position);
        
        if (!$stmt->execute()) {
            throw new Exception("Failed to add event group: " . $stmt->error);
        }
        
        $groupId = $stmt->insert_id;
        
        // Return the newly created event group
        $query = "SELECT * FROM event_groups WHERE id = ?";
        $stmt = $conn->prepare($query);
        $stmt->bind_param("i", $groupId);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows === 0) {
            throw new Exception("Failed to retrieve the new event group");
        }
        
        $eventGroup = $result->fetch_assoc();
        $eventGroup['events'] = []; // Initialize empty events array
        
        sendJsonResponse([
            'success' => true, 
            'message' => 'Event group added successfully', 
            'eventGroup' => $eventGroup
        ]);
    } catch (Exception $e) {
        sendJsonResponse(['success' => false, 'message' => $e->getMessage()], 500);
    }
}

// Update event group
function updateEventGroup() {
    global $conn;
    
    try {
        // Validate input
        if (!isset($_POST['id']) || !is_numeric($_POST['id'])) {
            throw new Exception("Invalid event group ID");
        }
        if (!isset($_POST['name']) || empty($_POST['name'])) {
            throw new Exception("Group name is required");
        }
        
        $id = (int)$_POST['id'];
        $name = $_POST['name'];
        
        // Update event group
        $query = "UPDATE event_groups SET name = ? WHERE id = ?";
        $stmt = $conn->prepare($query);
        $stmt->bind_param("si", $name, $id);
        
        if (!$stmt->execute()) {
            throw new Exception("Failed to update event group: " . $stmt->error);
        }
        
        if ($stmt->affected_rows === 0) {
            throw new Exception("Event group not found or no changes made");
        }
        
        sendJsonResponse([
            'success' => true, 
            'message' => 'Event group updated successfully'
        ]);
    } catch (Exception $e) {
        sendJsonResponse(['success' => false, 'message' => $e->getMessage()], 500);
    }
}

// Update event group position
function updateEventGroupPosition() {
    global $conn;
    
    try {
        // Validate input
        if (!isset($_POST['id']) || !is_numeric($_POST['id'])) {
            throw new Exception("Invalid event group ID");
        }
        if (!isset($_POST['position']) || !is_numeric($_POST['position']) || $_POST['position'] < 1) {
            throw new Exception("Invalid position value");
        }
        
        $id = (int)$_POST['id'];
        $position = (int)$_POST['position'];
        
        // Update event group position
        $query = "UPDATE event_groups SET position = ? WHERE id = ?";
        $stmt = $conn->prepare($query);
        $stmt->bind_param("ii", $position, $id);
        
        if (!$stmt->execute()) {
            throw new Exception("Failed to update event group position: " . $stmt->error);
        }
        
        if ($stmt->affected_rows === 0) {
            throw new Exception("Event group not found or position not changed");
        }
        
        sendJsonResponse([
            'success' => true, 
            'message' => 'Event group position updated successfully'
        ]);
    } catch (Exception $e) {
        sendJsonResponse(['success' => false, 'message' => $e->getMessage()], 500);
    }
}

// Delete event group
function deleteEventGroup() {
    global $conn;
    
    try {
        // Validate input
        if (!isset($_POST['id']) || !is_numeric($_POST['id'])) {
            throw new Exception("Invalid event group ID");
        }
        
        $id = (int)$_POST['id'];
        
        // Get all events in this group to delete their images
        $query = "SELECT image FROM events WHERE event_group_id = ? AND image IS NOT NULL";
        $stmt = $conn->prepare($query);
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        while ($event = $result->fetch_assoc()) {
            if (!empty($event['image'])) {
                deleteEventImage($event['image']);
            }
        }
        
        // Delete the event group (events will be deleted via ON DELETE CASCADE)
        $query = "DELETE FROM event_groups WHERE id = ?";
        $stmt = $conn->prepare($query);
        $stmt->bind_param("i", $id);
        
        if (!$stmt->execute()) {
            throw new Exception("Failed to delete event group: " . $stmt->error);
        }
        
        if ($stmt->affected_rows === 0) {
            throw new Exception("Event group not found");
        }
        
        sendJsonResponse([
            'success' => true, 
            'message' => 'Event group deleted successfully'
        ]);
    } catch (Exception $e) {
        sendJsonResponse(['success' => false, 'message' => $e->getMessage()], 500);
    }
}

// Add new event
function addEvent() {
    global $conn, $uploadsDir;
    
    try {
        // Validate input
        if (!isset($_POST['event_group_id']) || !is_numeric($_POST['event_group_id'])) {
            throw new Exception("Invalid event group ID");
        }
        if (!isset($_POST['title']) || empty($_POST['title'])) {
            throw new Exception("Event title is required");
        }
        
        $eventGroupId = (int)$_POST['event_group_id'];
        $title = $_POST['title'];
        $description = isset($_POST['description']) ? $_POST['description'] : '';
        $image = null;
        
        // Handle image upload
        if (isset($_FILES['image']) && $_FILES['image']['error'] === 0) {
            $image = handleImageUpload($_FILES['image']);
        }
        
        // Insert new event
        $query = "INSERT INTO events (event_group_id, title, description, image) VALUES (?, ?, ?, ?)";
        $stmt = $conn->prepare($query);
        $stmt->bind_param("isss", $eventGroupId, $title, $description, $image);
        
        if (!$stmt->execute()) {
            // If image was uploaded but insert failed, delete the uploaded image
            if ($image) {
                deleteEventImage($image);
            }
            throw new Exception("Failed to add event: " . $stmt->error);
        }
        
        sendJsonResponse([
            'success' => true, 
            'message' => 'Event added successfully',
            'eventId' => $stmt->insert_id
        ]);
    } catch (Exception $e) {
        sendJsonResponse(['success' => false, 'message' => $e->getMessage()], 500);
    }
}

// Update existing event
function updateEvent() {
    global $conn;
    
    try {
        // Validate input
        if (!isset($_POST['id']) || !is_numeric($_POST['id'])) {
            throw new Exception("Invalid event ID");
        }
        if (!isset($_POST['title']) || empty($_POST['title'])) {
            throw new Exception("Event title is required");
        }
        if (!isset($_POST['event_group_id']) || !is_numeric($_POST['event_group_id'])) {
            throw new Exception("Invalid event group ID");
        }
        
        $id = (int)$_POST['id'];
        $eventGroupId = (int)$_POST['event_group_id'];
        $title = $_POST['title'];
        $description = isset($_POST['description']) ? $_POST['description'] : '';
        
        // Get current event data for image handling
        $query = "SELECT image FROM events WHERE id = ?";
        $stmt = $conn->prepare($query);
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows === 0) {
            throw new Exception("Event not found");
        }
        
        $currentEvent = $result->fetch_assoc();
        $image = $currentEvent['image'];
        
        // Handle image upload if provided
        if (isset($_FILES['image']) && $_FILES['image']['error'] === 0) {
            // Delete old image if exists
            if (!empty($image)) {
                deleteEventImage($image);
            }
            
            // Upload new image
            $image = handleImageUpload($_FILES['image']);
        }
        
        // Update event
        $query = "UPDATE events SET event_group_id = ?, title = ?, description = ?, image = ? WHERE id = ?";
        $stmt = $conn->prepare($query);
        $stmt->bind_param("isssi", $eventGroupId, $title, $description, $image, $id);
        
        if (!$stmt->execute()) {
            throw new Exception("Failed to update event: " . $stmt->error);
        }
        
        sendJsonResponse([
            'success' => true, 
            'message' => 'Event updated successfully'
        ]);
    } catch (Exception $e) {
        sendJsonResponse(['success' => false, 'message' => $e->getMessage()], 500);
    }
}

// Delete event
function deleteEvent() {
    global $conn;
    
    try {
        // Validate input
        if (!isset($_POST['id']) || !is_numeric($_POST['id'])) {
            throw new Exception("Invalid event ID");
        }
        
        $id = (int)$_POST['id'];
        
        // Get event image to delete it from server
        $query = "SELECT image FROM events WHERE id = ?";
        $stmt = $conn->prepare($query);
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows === 0) {
            throw new Exception("Event not found");
        }
        
        $event = $result->fetch_assoc();
        
        // Delete event image if exists
        if (!empty($event['image'])) {
            deleteEventImage($event['image']);
        }
        
        // Delete event
        $query = "DELETE FROM events WHERE id = ?";
        $stmt = $conn->prepare($query);
        $stmt->bind_param("i", $id);
        
        if (!$stmt->execute()) {
            throw new Exception("Failed to delete event: " . $stmt->error);
        }
        
        sendJsonResponse([
            'success' => true, 
            'message' => 'Event deleted successfully'
        ]);
    } catch (Exception $e) {
        sendJsonResponse(['success' => false, 'message' => $e->getMessage()], 500);
    }
}

// Helper function to handle image upload
function handleImageUpload($file) {
    global $uploadsDir;
    
    $allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    
    if (!in_array($file['type'], $allowedTypes)) {
        throw new Exception("Invalid file type. Only JPG, PNG, GIF, and WebP are allowed.");
    }
    
    $maxFileSize = 5 * 1024 * 1024; // 5MB
    if ($file['size'] > $maxFileSize) {
        throw new Exception("File size too large. Maximum size is 5MB.");
    }
    
    // Generate unique filename to prevent overwriting
    $fileName = uniqid('event_') . '_' . time() . '.' . pathinfo($file['name'], PATHINFO_EXTENSION);
    $targetPath = $uploadsDir . $fileName;
    
    if (!move_uploaded_file($file['tmp_name'], $targetPath)) {
        throw new Exception("Failed to upload image");
    }
    
    return $fileName;
}

// Helper function to delete event image
function deleteEventImage($imageName) {
    global $uploadsDir;
    
    $imagePath = $uploadsDir . $imageName;
    if (file_exists($imagePath)) {
        unlink($imagePath);
    }
}
?>
<?php
require_once 'db.php';

$request_method = $_SERVER['REQUEST_METHOD'];
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$uri = explode('/', $uri);
$endpoint = end($uri);

// Handle image uploads
function handleImageUpload() {
    $target_dir = "uploads/webinars/";
    if (!file_exists($target_dir)) {
        mkdir($target_dir, 0755, true);
    }

    $file = $_FILES['image'];
    $target_file = $target_dir . basename($file["name"]);
    $imageFileType = strtolower(pathinfo($target_file, PATHINFO_EXTENSION));
    
    if (move_uploaded_file($file["tmp_name"], $target_file)) {
        return $target_file;
    }
    throw new Exception("Failed to upload image.");
}

switch($request_method) {
    case 'GET':
        if ($endpoint === 'groups') {
            $query = "SELECT * FROM webinar_groups";
            $result = $conn->query($query);
            $groups = $result->fetch_all(MYSQLI_ASSOC);
            sendJsonResponse($groups);
        } elseif ($endpoint === 'webinars') {
            $group_id = isset($_GET['group_id']) ? $_GET['group_id'] : null;
            $query = "SELECT * FROM webinars WHERE group_id = ? ORDER BY date ASC, time ASC";
            $stmt = $conn->prepare($query);
            $stmt->bind_param("i", $group_id);
            $stmt->execute();
            $result = $stmt->get_result();
            $webinars = $result->fetch_all(MYSQLI_ASSOC);
            sendJsonResponse($webinars);
        }
        break;

    case 'POST':
        if ($endpoint === 'webinars') {
            $data = json_decode(file_get_contents('php://input'), true);
            $image_path = isset($_FILES['image']) ? handleImageUpload() : null;
            
            $query = "INSERT INTO webinars (group_id, title, description, date, time, duration, status, speaker, registration_link, image_path) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
            $stmt = $conn->prepare($query);
            $stmt->bind_param("isssssssss", 
                $data['group_id'],
                $data['title'],
                $data['description'],
                $data['date'],
                $data['time'],
                $data['duration'],
                $data['status'],
                $data['speaker'],
                $data['registration_link'],
                $image_path
            );
            
            if ($stmt->execute()) {
                sendJsonResponse(['message' => 'Webinar added successfully', 'id' => $conn->insert_id]);
            }
        }
        break;

    case 'PUT':
        if ($endpoint === 'webinars') {
            $data = json_decode(file_get_contents('php://input'), true);
            $image_path = isset($_FILES['image']) ? handleImageUpload() : $data['image_path'];
            
            $query = "UPDATE webinars SET 
                     group_id = ?, title = ?, description = ?, date = ?, 
                     time = ?, duration = ?, status = ?, speaker = ?, 
                     registration_link = ?, image_path = ?
                     WHERE id = ?";
            $stmt = $conn->prepare($query);
            $stmt->bind_param("isssssssssi",
                $data['group_id'],
                $data['title'],
                $data['description'],
                $data['date'],
                $data['time'],
                $data['duration'],
                $data['status'],
                $data['speaker'],
                $data['registration_link'],
                $image_path,
                $data['id']
            );
            
            if ($stmt->execute()) {
                sendJsonResponse(['message' => 'Webinar updated successfully']);
            }
        }
        break;

    case 'DELETE':
        if ($endpoint === 'webinars') {
            $id = $_GET['id'];
            $query = "DELETE FROM webinars WHERE id = ?";
            $stmt = $conn->prepare($query);
            $stmt->bind_param("i", $id);
            
            if ($stmt->execute()) {
                sendJsonResponse(['message' => 'Webinar deleted successfully']);
            }
        }
        break;
}
?>
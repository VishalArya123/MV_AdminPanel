<?php
require_once 'db.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    sendJsonResponse(['status' => 'ok']);
}

try {
    switch ($_SERVER['REQUEST_METHOD']) {
        case 'GET':
            $sql = "SELECT * FROM video_testimonials ORDER BY created_at DESC";
            error_log("Executing query: " . $sql);
            
            $result = $conn->query($sql);
            if (!$result) {
                throw new Exception("Query failed: " . $conn->error);
            }
            
            $videos = [];
            while ($row = $result->fetch_assoc()) {
                $videos[] = $row;
            }
            
            sendJsonResponse($videos);
            break;

        case 'POST':
            if (isset($_POST['_method']) && $_POST['_method'] === 'DELETE') {
                $id = $conn->real_escape_string($_POST['id']);
                
                $stmt = $conn->prepare("DELETE FROM video_testimonials WHERE id = ?");
                $stmt->bind_param("i", $id);
                
                if (!$stmt->execute()) {
                    throw new Exception("Delete failed: " . $stmt->error);
                }
                
                sendJsonResponse(['success' => true]);
            } else {
                $name = $conn->real_escape_string($_POST['name']);
                $description = $conn->real_escape_string($_POST['description']);
                $videoUrl = $conn->real_escape_string($_POST['videoUrl']);
                
                if (isset($_POST['id'])) {
                    // Update
                    $id = $conn->real_escape_string($_POST['id']);
                    $stmt = $conn->prepare("UPDATE video_testimonials SET name=?, description=?, videoUrl=? WHERE id=?");
                    $stmt->bind_param("sssi", $name, $description, $videoUrl, $id);
                } else {
                    // Create
                    $stmt = $conn->prepare("INSERT INTO video_testimonials (name, description, videoUrl) VALUES (?, ?, ?)");
                    $stmt->bind_param("sss", $name, $description, $videoUrl);
                }
                
                if (!$stmt->execute()) {
                    throw new Exception("Operation failed: " . $stmt->error);
                }
                
                sendJsonResponse(['success' => true]);
            }
            break;

        default:
            throw new Exception("Invalid request method");
    }
} catch (Exception $e) {
    error_log("Error in video_testimonials.php: " . $e->getMessage());
    sendJsonResponse(['error' => $e->getMessage()], 500);
}

$conn->close();
?>
<?php
// Enable CORS for any origin
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Include database connection
require_once 'db.php';

// Set upload directory
$upload_dir = 'uploads/newsletters/';

// Create directory if it doesn't exist
if (!file_exists($upload_dir)) {
    mkdir($upload_dir, 0755, true);
}

// Function to handle database connection
function get_connection() {
    $conn = conn(); // Using the existing conn function from db.php
    if (!$conn) {
        send_error("Database connection failed");
    }
    return $conn;
}

// Function to send JSON response
function send_response($data, $status = 200) {
    http_response_code($status);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit();
}

// Function to send error response
function send_error($message, $status = 400) {
    send_response(['success' => false, 'message' => $message], $status);
}

// Function to handle file upload
function handle_file_upload($file, $old_filename = null) {
    global $upload_dir;
    
    // Check if file is uploaded
    if (!isset($file) || !$file['name']) {
        return $old_filename;
    }
    
    // Generate unique filename
    $filename = uniqid() . '_' . basename($file['name']);
    $target_path = $upload_dir . $filename;
    
    // Move uploaded file
    if (move_uploaded_file($file['tmp_name'], $target_path)) {
        // Delete old file if exists
        if ($old_filename && file_exists($upload_dir . $old_filename)) {
            unlink($upload_dir . $old_filename);
        }
        return $filename;
    } else {
        send_error("Failed to upload file");
    }
}

// Get all newsletters
function get_newsletters() {
    $conn = get_connection();
    $query = "SELECT * FROM newsletters ORDER BY id DESC";
    $result = mysqli_query($conn, $query);
    
    if (!$result) {
        send_error("Failed to fetch newsletters: " . mysqli_error($conn));
    }
    
    $newsletters = [];
    while ($row = mysqli_fetch_assoc($result)) {
        $newsletters[] = $row;
    }
    
    mysqli_close($conn);
    send_response($newsletters);
}

// Create new newsletter
function create_newsletter() {
    $conn = get_connection();
    
    // Validate required fields
    if (empty($_POST['title']) || empty($_POST['previewText']) || empty($_POST['date']) || empty($_POST['category'])) {
        send_error("Required fields are missing");
    }
    
    // Handle image upload
    $coverImage = isset($_FILES['coverImage']) ? handle_file_upload($_FILES['coverImage']) : null;
    
    // Prepare data for insertion
    $title = mysqli_real_escape_string($conn, $_POST['title']);
    $previewText = mysqli_real_escape_string($conn, $_POST['previewText']);
    $date = mysqli_real_escape_string($conn, $_POST['date']);
    $fullPdfLink = isset($_POST['fullPdfLink']) ? mysqli_real_escape_string($conn, $_POST['fullPdfLink']) : '';
    $category = mysqli_real_escape_string($conn, $_POST['category']);
    
    // Insert into database
    $query = "INSERT INTO newsletters (title, previewText, date, coverImage, fullPdfLink, category) 
              VALUES ('$title', '$previewText', '$date', '$coverImage', '$fullPdfLink', '$category')";
    
    if (mysqli_query($conn, $query)) {
        $id = mysqli_insert_id($conn);
        mysqli_close($conn);
        send_response(['success' => true, 'message' => 'Newsletter created successfully', 'id' => $id]);
    } else {
        send_error("Failed to create newsletter: " . mysqli_error($conn));
    }
}

// Update existing newsletter
function update_newsletter() {
    $conn = get_connection();
    
    // Check if ID is provided
    if (!isset($_POST['id'])) {
        send_error("Newsletter ID is required");
    }
    
    $id = mysqli_real_escape_string($conn, $_POST['id']);
    
    // Get existing newsletter data
    $query = "SELECT * FROM newsletters WHERE id = '$id'";
    $result = mysqli_query($conn, $query);
    
    if (!$result || mysqli_num_rows($result) === 0) {
        send_error("Newsletter not found");
    }
    
    $current_data = mysqli_fetch_assoc($result);
    
    // Handle image upload
    $coverImage = isset($_FILES['coverImage']) && $_FILES['coverImage']['size'] > 0 
        ? handle_file_upload($_FILES['coverImage'], $current_data['coverImage']) 
        : $current_data['coverImage'];
    
    // Prepare data for update
    $title = mysqli_real_escape_string($conn, $_POST['title']);
    $previewText = mysqli_real_escape_string($conn, $_POST['previewText']);
    $date = mysqli_real_escape_string($conn, $_POST['date']);
    $fullPdfLink = isset($_POST['fullPdfLink']) ? mysqli_real_escape_string($conn, $_POST['fullPdfLink']) : $current_data['fullPdfLink'];
    $category = mysqli_real_escape_string($conn, $_POST['category']);
    
    // Update database
    $query = "UPDATE newsletters SET 
              title = '$title', 
              previewText = '$previewText', 
              date = '$date', 
              coverImage = '$coverImage', 
              fullPdfLink = '$fullPdfLink', 
              category = '$category' 
              WHERE id = '$id'";
    
    if (mysqli_query($conn, $query)) {
        mysqli_close($conn);
        send_response(['success' => true, 'message' => 'Newsletter updated successfully']);
    } else {
        send_error("Failed to update newsletter: " . mysqli_error($conn));
    }
}

// Delete newsletter
function delete_newsletter() {
    $conn = get_connection();
    
    // Check if ID is provided
    if (!isset($_POST['id'])) {
        send_error("Newsletter ID is required");
    }
    
    $id = mysqli_real_escape_string($conn, $_POST['id']);
    
    // Get newsletter data for image deletion
    $query = "SELECT coverImage FROM newsletters WHERE id = '$id'";
    $result = mysqli_query($conn, $query);
    
    if ($result && mysqli_num_rows($result) > 0) {
        $row = mysqli_fetch_assoc($result);
        $coverImage = $row['coverImage'];
        
        // Delete image file if exists
        if ($coverImage && file_exists($upload_dir . $coverImage)) {
            unlink($upload_dir . $coverImage);
        }
        
        // Delete from database
        $query = "DELETE FROM newsletters WHERE id = '$id'";
        
        if (mysqli_query($conn, $query)) {
            mysqli_close($conn);
            send_response(['success' => true, 'message' => 'Newsletter deleted successfully']);
        } else {
            send_error("Failed to delete newsletter: " . mysqli_error($conn));
        }
    } else {
        send_error("Newsletter not found");
    }
}

// Handle API requests
try {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        if (isset($_GET['action']) && $_GET['action'] === 'get') {
            get_newsletters();
        } else {
            send_error("Invalid GET request");
        }
    } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        if (isset($_POST['action'])) {
            switch ($_POST['action']) {
                case 'create':
                    create_newsletter();
                    break;
                case 'update':
                    update_newsletter();
                    break;
                case 'delete':
                    delete_newsletter();
                    break;
                default:
                    send_error("Invalid action");
            }
        } else {
            send_error("Action is required");
        }
    } else {
        send_error("Invalid request method");
    }
} catch (Exception $e) {
    send_error("An error occurred: " . $e->getMessage());
}
?>
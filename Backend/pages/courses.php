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

// Set upload directories
define('THUMBNAIL_DIR', 'uploads/courses/thumbnails');
define('VIDEO_DIR', 'uploads/courses/videos');

// Create directories if they don't exist
if (!file_exists(THUMBNAIL_DIR)) {
    mkdir(THUMBNAIL_DIR, 0755, true);
}

if (!file_exists(VIDEO_DIR)) {
    mkdir(VIDEO_DIR, 0755, true);
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

// Function to create a slug from title
function create_slug($title) {
    $slug = strtolower(trim($title));
    // Replace non-alphanumeric characters with dashes
    $slug = preg_replace('/[^a-z0-9-]/', '-', $slug);
    // Replace multiple dashes with single dash
    $slug = preg_replace('/-+/', '-', $slug);
    // Trim dashes from beginning and end
    $slug = trim($slug, '-');
    return $slug;
}

// Function to handle file upload
function handle_file_upload($file_key, $upload_dir, $allowed_types, $old_file = null) {
    if (!isset($_FILES[$file_key]) || $_FILES[$file_key]['error'] !== 0) {
        send_error("File upload error: " . ($_FILES[$file_key]['error'] ?? 'Unknown error'));
    }
    
    // Validate file type
    $file_type = $_FILES[$file_key]['type'];
    if (!in_array($file_type, $allowed_types)) {
        $allowed_extensions = implode(', ', array_map(function($type) {
            return str_replace('image/', '', str_replace('video/', '', $type));
        }, $allowed_types));
        
        send_error("Invalid file type ($file_type). Allowed types: $allowed_extensions");
    }
    
    // Validate file size
    $max_size = 500 * 1024 * 1024; // 500MB (increased for video files)
    if ($_FILES[$file_key]['size'] > $max_size) {
        send_error('File too large. Maximum size is 500MB.');
    }
    
    // Create a safe filename
    $file_ext = strtolower(pathinfo($_FILES[$file_key]['name'], PATHINFO_EXTENSION));
    $new_file_name = uniqid() . '.' . $file_ext;
    
    // Ensure directory exists
    if (!is_dir($upload_dir)) {
        if (!mkdir($upload_dir, 0777, true)) {
            send_error("Failed to create directory: $upload_dir");
        }
    }
    
    // Check directory permissions
    if (!is_writable($upload_dir)) {
        send_error("Upload directory is not writable: $upload_dir");
    }
    
    $target_file_path = $upload_dir . '/' . $new_file_name;
    
    // Move uploaded file
    if (!move_uploaded_file($_FILES[$file_key]['tmp_name'], $target_file_path)) {
        send_error("Failed to upload file. PHP error: " . error_get_last()['message']);
    }
    
    // Delete old file if exists
    if ($old_file && file_exists($old_file)) {
        if (!unlink($old_file)) {
            // Log error but continue with the upload
            error_log("Failed to delete old file: " . $old_file);
        }
    }
    
    return $target_file_path;
}

// Get all courses or filter by criteria
function get_courses() {
    $conn = get_connection();
    $where = "";
    $params = [];
    $types = "";
    
    // Filter by category
    if (isset($_GET['category'])) {
        $where .= (empty($where) ? "WHERE " : " AND ") . "category = ?";
        $params[] = $_GET['category'];
        $types .= "s";
    }
    
    // Filter by level
    if (isset($_GET['level'])) {
        $where .= (empty($where) ? "WHERE " : " AND ") . "level = ?";
        $params[] = $_GET['level'];
        $types .= "s";
    }
    
    // Filter by instructor
    if (isset($_GET['instructor_id'])) {
        $where .= (empty($where) ? "WHERE " : " AND ") . "instructor_id = ?";
        $params[] = (int)$_GET['instructor_id'];
        $types .= "i";
    }
    
    // Search functionality
    if (isset($_GET['search']) && !empty($_GET['search'])) {
        $search_term = "%" . $_GET['search'] . "%";
        $where .= (empty($where) ? "WHERE " : " AND ") . "(title LIKE ? OR description LIKE ? OR short_description LIKE ?)";
        $params[] = $search_term;
        $params[] = $search_term;
        $params[] = $search_term;
        $types .= "sss";
    }
    
    // Get a specific course by ID
    if (isset($_GET['id'])) {
        $stmt = $conn->prepare("SELECT * FROM courses WHERE id = ?");
        if (!$stmt) {
            send_error("Database error: " . $conn->error, 500);
        }
        
        $stmt->bind_param("i", $_GET['id']);
        $stmt->execute();
        $result = $stmt->get_result();
        $course = $result->fetch_assoc();
        
        if (!$course) {
            send_error("Course not found", 404);
        }
        
        send_response($course);
    } 
    
    // Get a specific course by slug
    if (isset($_GET['slug'])) {
        $stmt = $conn->prepare("SELECT * FROM courses WHERE slug = ?");
        if (!$stmt) {
            send_error("Database error: " . $conn->error, 500);
        }
        
        $stmt->bind_param("s", $_GET['slug']);
        $stmt->execute();
        $result = $stmt->get_result();
        $course = $result->fetch_assoc();
        
        if (!$course) {
            send_error("Course not found", 404);
        }
        
        send_response($course);
    }
    
    // Pagination parameters
    $page = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
    $limit = isset($_GET['limit']) ? min(100, max(1, (int)$_GET['limit'])) : 10;
    $offset = ($page - 1) * $limit;
    
    // Get total count for pagination
    $count_sql = "SELECT COUNT(*) as total FROM courses $where";
    
    if (!empty($params)) {
        $count_stmt = $conn->prepare($count_sql);
        if (!$count_stmt) {
            send_error("Database error: " . $conn->error, 500);
        }
        
        $count_stmt->bind_param($types, ...$params);
        $count_stmt->execute();
        $total_count = $count_stmt->get_result()->fetch_assoc()['total'];
        $count_stmt->close();
    } else {
        $count_result = $conn->query($count_sql);
        if (!$count_result) {
            send_error("Database error: " . $conn->error, 500);
        }
        
        $total_count = $count_result->fetch_assoc()['total'];
    }
    
    // Get courses with pagination
    $sql = "SELECT * FROM courses $where ORDER BY created_at DESC LIMIT ? OFFSET ?";
    
    if (!empty($params)) {
        $stmt = $conn->prepare($sql);
        if (!$stmt) {
            send_error("Database error: " . $conn->error, 500);
        }
        
        $types .= "ii";
        $params[] = $limit;
        $params[] = $offset;
        $stmt->bind_param($types, ...$params);
    } else {
        $stmt = $conn->prepare($sql);
        if (!$stmt) {
            send_error("Database error: " . $conn->error, 500);
        }
        
        $stmt->bind_param("ii", $limit, $offset);
    }
    
    $stmt->execute();
    $result = $stmt->get_result();
    
    $courses = [];
    while ($row = $result->fetch_assoc()) {
        // Format URLs for frontend if needed
        $courses[] = $row;
    }
    
    // Return courses with pagination metadata
    send_response([
        'success' => true,
        'data' => $courses,
        'pagination' => [
            'total' => (int)$total_count,
            'page' => $page,
            'limit' => $limit,
            'pages' => ceil($total_count / $limit)
        ]
    ]);
}

// Create new course
function create_course() {
    $conn = get_connection();
    
    // Validate required fields
    if (empty($_POST['title'])) {
        send_error("Title is required");
    }
    
    // Extract and sanitize input
    $title = $conn->real_escape_string($_POST['title']);
    $slug = isset($_POST['slug']) && !empty($_POST['slug']) ? 
            $conn->real_escape_string($_POST['slug']) : 
            create_slug($title);
    $description = $conn->real_escape_string($_POST['description'] ?? '');
    $short_description = $conn->real_escape_string($_POST['short_description'] ?? '');
    $category = $conn->real_escape_string($_POST['category'] ?? '');
    $instructor_id = isset($_POST['instructor_id']) ? (int)$_POST['instructor_id'] : 0;
    $language = $conn->real_escape_string($_POST['language'] ?? '');
    $price = isset($_POST['price']) ? (float)$_POST['price'] : 0;
    $discount_price = (isset($_POST['discount_price']) && $_POST['discount_price'] !== '') ? 
                      (float)$_POST['discount_price'] : null;
    $level = $conn->real_escape_string($_POST['level'] ?? '');
    $duration = $conn->real_escape_string($_POST['duration'] ?? '');
    $is_published = isset($_POST['is_published']) ? (int)$_POST['is_published'] : 0;
    
    // Initialize file paths
    $thumbnail = '';
    $video_file = '';
    $video_url = isset($_POST['video_url']) ? $conn->real_escape_string($_POST['video_url']) : '';
    
    // Check for duplicate slug
    $check_stmt = $conn->prepare("SELECT id FROM courses WHERE slug = ?");
    if (!$check_stmt) {
        send_error("Database error: " . $conn->error, 500);
    }
    
    $check_stmt->bind_param("s", $slug);
    $check_stmt->execute();
    $check_result = $check_stmt->get_result();
    
    if ($check_result->num_rows > 0) {
        $slug = $slug . '-' . uniqid();
    }
    
    $check_stmt->close();
    
    // Handle thumbnail upload
    if (isset($_FILES['thumbnail']) && $_FILES['thumbnail']['error'] === 0) {
        $thumbnail = handle_file_upload(
            'thumbnail', 
            THUMBNAIL_DIR, 
            ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
        );
    }
    
    // Handle video upload
    if (isset($_FILES['video_file']) && $_FILES['video_file']['error'] === 0) {
        $video_file = handle_file_upload(
            'video_file', 
            VIDEO_DIR, 
            ['video/mp4', 'video/webm', 'video/ogg']
        );
        // If new video file is uploaded, clear the video URL
        $video_url = '';
    }
    
    // Prepare SQL
    $sql = "INSERT INTO courses (
                title, slug, description, short_description, category, 
                instructor_id, language, price, discount_price, thumbnail, 
                video_url, video_file, level, duration, is_published, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())";
            
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        send_error("Database error: " . $conn->error, 500);
    }
    
    // Bind parameters
    $stmt->bind_param(
        "sssssiddssssssi",
        $title, $slug, $description, $short_description, $category,
        $instructor_id, $language, $price, $discount_price, $thumbnail,
        $video_url, $video_file, $level, $duration, $is_published
    );
    
    if (!$stmt->execute()) {
        send_error("Failed to create course: " . $stmt->error, 500);
    }
    
    $new_id = $conn->insert_id;
    
    // Return the newly created course ID
    send_response([
        'success' => true, 
        'message' => 'Course created successfully',
        'course_id' => $new_id,
        'slug' => $slug
    ]);
}

// Update existing course
function update_course() {
    $conn = get_connection();
    
    // Check if ID is provided
    if (!isset($_POST['id']) || empty($_POST['id'])) {
        send_error("Course ID is required");
    }
    
    $id = (int)$_POST['id'];
    
    // Get current course data
    $stmt = $conn->prepare("SELECT thumbnail, video_file, video_url, slug FROM courses WHERE id = ?");
    if (!$stmt) {
        send_error("Database error: " . $conn->error, 500);
    }
    
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $result = $stmt->get_result();
    $current_course = $result->fetch_assoc();
    $stmt->close();
    
    if (!$current_course) {
        send_error("Course not found", 404);
    }
    
    // Extract and sanitize input
    $title = $conn->real_escape_string($_POST['title'] ?? '');
    
    // Handle slug
    $original_slug = $current_course['slug'];
    $new_slug = isset($_POST['slug']) && !empty($_POST['slug']) ? 
               $conn->real_escape_string($_POST['slug']) : 
               ($title ? create_slug($title) : $original_slug);
    
    // Check for duplicate slug only if changed
    if ($new_slug !== $original_slug) {
        $check_stmt = $conn->prepare("SELECT id FROM courses WHERE slug = ? AND id != ?");
        if (!$check_stmt) {
            send_error("Database error: " . $conn->error, 500);
        }
        
        $check_stmt->bind_param("si", $new_slug, $id);
        $check_stmt->execute();
        $check_result = $check_stmt->get_result();
        
        if ($check_result->num_rows > 0) {
            $new_slug = $new_slug . '-' . uniqid();
        }
        
        $check_stmt->close();
    }
    
    $description = $conn->real_escape_string($_POST['description'] ?? '');
    $short_description = $conn->real_escape_string($_POST['short_description'] ?? '');
    $category = $conn->real_escape_string($_POST['category'] ?? '');
    $instructor_id = isset($_POST['instructor_id']) ? (int)$_POST['instructor_id'] : 0;
    $language = $conn->real_escape_string($_POST['language'] ?? '');
    $price = isset($_POST['price']) ? (float)$_POST['price'] : 0;
    $discount_price = (isset($_POST['discount_price']) && $_POST['discount_price'] !== '') ? 
                      (float)$_POST['discount_price'] : null;
    $level = $conn->real_escape_string($_POST['level'] ?? '');
    $duration = $conn->real_escape_string($_POST['duration'] ?? '');
    $is_published = isset($_POST['is_published']) ? (int)$_POST['is_published'] : 0;
    
    // Initialize with current values
    $thumbnail = $current_course['thumbnail'] ?? '';
    $video_file = $current_course['video_file'] ?? '';
    $video_url = isset($_POST['video_url']) ? $conn->real_escape_string($_POST['video_url']) : '';
    
    // Handle thumbnail upload
    if (isset($_FILES['thumbnail']) && $_FILES['thumbnail']['error'] === 0) {
        $thumbnail = handle_file_upload(
            'thumbnail', 
            THUMBNAIL_DIR, 
            ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
            $current_course['thumbnail']
        );
    } elseif (isset($_POST['remove_thumbnail']) && $_POST['remove_thumbnail'] == 1) {
        // Delete thumbnail if remove flag is set
        if (!empty($current_course['thumbnail']) && file_exists($current_course['thumbnail'])) {
            if (!unlink($current_course['thumbnail'])) {
                error_log("Failed to delete thumbnail: " . $current_course['thumbnail']);
            }
        }
        $thumbnail = '';
    }
    
    // Handle video upload or removal
    if (isset($_FILES['video_file']) && $_FILES['video_file']['error'] === 0) {
        $video_file = handle_file_upload(
            'video_file', 
            VIDEO_DIR, 
            ['video/mp4', 'video/webm', 'video/ogg'],
            $current_course['video_file']
        );
        // If new video file is uploaded, clear the video URL
        $video_url = '';
    } elseif (isset($_POST['remove_video']) && $_POST['remove_video'] == 1) {
        // Delete video if remove flag is set
        if (!empty($current_course['video_file']) && file_exists($current_course['video_file'])) {
            if (!unlink($current_course['video_file'])) {
                error_log("Failed to delete video: " . $current_course['video_file']);
            }
        }
        $video_file = '';
        // Also clear video URL if video is being removed
        $video_url = '';
    }
    
    // Update course record
    $sql = "UPDATE courses SET 
                title = ?, 
                slug = ?, 
                description = ?, 
                short_description = ?, 
                category = ?, 
                instructor_id = ?, 
                language = ?, 
                price = ?, 
                discount_price = ?, 
                thumbnail = ?, 
                video_url = ?, 
                video_file = ?, 
                level = ?, 
                duration = ?, 
                is_published = ?,
                updated_at = NOW()
            WHERE id = ?";
            
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        send_error("Database error: " . $conn->error, 500);
    }
    
    // Bind parameters
    $stmt->bind_param(
        "sssssiddssssssi",
        $title, $new_slug, $description, $short_description, $category,
        $instructor_id, $language, $price, $discount_price, $thumbnail,
        $video_url, $video_file, $level, $duration, $is_published, $id
    );
    
    if (!$stmt->execute()) {
        send_error("Failed to update course: " . $stmt->error, 500);
    }
    
    send_response([
        'success' => true, 
        'message' => 'Course updated successfully',
        'slug' => $new_slug
    ]);
}

// Delete course
function delete_course() {
    $conn = get_connection();
    
    // Check if ID is provided
    if (!isset($_POST['id']) || empty($_POST['id'])) {
        send_error("Course ID is required");
    }
    
    $id = (int)$_POST['id'];
    
    // Get course details before deleting
    $stmt = $conn->prepare("SELECT thumbnail, video_file FROM courses WHERE id = ?");
    if (!$stmt) {
        send_error("Database error: " . $conn->error, 500);
    }
    
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $result = $stmt->get_result();
    $course = $result->fetch_assoc();
    $stmt->close();
    
    if (!$course) {
        send_error("Course not found", 404);
    }
    
    // Delete thumbnail file if exists
    if (!empty($course['thumbnail']) && file_exists($course['thumbnail'])) {
        if (!unlink($course['thumbnail'])) {
            error_log("Failed to delete thumbnail: " . $course['thumbnail']);
        }
    }
    
    // Delete video file if exists
    if (!empty($course['video_file']) && file_exists($course['video_file'])) {
        if (!unlink($course['video_file'])) {
            error_log("Failed to delete video: " . $course['video_file']);
        }
    }
    
    // Delete the course from database
    $stmt = $conn->prepare("DELETE FROM courses WHERE id = ?");
    if (!$stmt) {
        send_error("Database error: " . $conn->error, 500);
    }
    
    $stmt->bind_param("i", $id);
    
    if (!$stmt->execute()) {
        send_error("Failed to delete course: " . $stmt->error, 500);
    }
    
    send_response(['success' => true, 'message' => 'Course deleted successfully']);
}

// Handle API requests
try {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        get_courses();
    } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        if (isset($_POST['_method']) && $_POST['_method'] === 'DELETE') {
            delete_course();
        } elseif (isset($_POST['id']) && !empty($_POST['id'])) {
            update_course();
        } else {
            create_course();
        }
    } elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
        parse_str(file_get_contents("php://input"), $_DELETE);
        if (!isset($_DELETE['id'])) {
            send_error("Course ID is required");
        }
        
        $_POST['id'] = $_DELETE['id'];
        delete_course();
    } elseif ($_SERVER['REQUEST_METHOD'] === 'PUT') {
        parse_str(file_get_contents("php://input"), $_PUT);
        if (!isset($_PUT['id'])) {
            send_error("Course ID is required");
        }
        
        $_POST = array_merge($_POST, $_PUT);
        update_course();
    } else {
        send_error("Invalid request method");
    }
} catch (Exception $e) {
    send_error("An error occurred: " . $e->getMessage(), 500);
}
?>
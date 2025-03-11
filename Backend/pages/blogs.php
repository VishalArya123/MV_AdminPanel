<?php
require_once 'db.php'; // Include the database connection file

// Set the image upload path
$image_path = 'uploads/blogs/';

// Create the directory if it doesn't exist
if (!file_exists($image_path)) {
    mkdir($image_path, 0777, true);
}

// Get the action from the request
$action = isset($_POST['action']) ? $_POST['action'] : (isset($_GET['action']) ? $_GET['action'] : '');

// Set headers for JSON response
header('Content-Type: application/json');

// Perform the requested action
switch ($action) {
    case 'get':
        getBlogs();
        break;
    case 'add':
        addBlog();
        break;
    case 'update':
        updateBlog();
        break;
    case 'delete':
        deleteBlog();
        break;
    default:
        echo json_encode(['success' => false, 'message' => 'Invalid action']);
}

// Function to get all blogs
function getBlogs() {
    global $conn;
    
    try {
        $query = "SELECT * FROM blogs ORDER BY id DESC";
        $result = $conn->query($query);
        
        $blogs = [];
        if ($result->num_rows > 0) {
            while ($row = $result->fetch_assoc()) {
                $blogs[] = $row;
            }
        }
        
        echo json_encode($blogs);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}

// Function to add a new blog
function addBlog() {
    global $conn, $image_path;
    
    try {
        // Validate required fields
        $requiredFields = ['title', 'author', 'date', 'readTime', 'category', 'excerpt'];
        foreach ($requiredFields as $field) {
            if (!isset($_POST[$field]) || empty($_POST[$field])) {
                throw new Exception("Field '{$field}' is required");
            }
        }
        
        // Check if image was uploaded
        if (!isset($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
            throw new Exception("Image upload failed");
        }
        
        // Process image upload
        $image = $_FILES['image'];
        $imageFileName = time() . '_' . basename($image['name']);
        $targetPath = $image_path . $imageFileName;
        
        // Check file type
        $allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!in_array($image['type'], $allowedTypes)) {
            throw new Exception("Invalid file type. Only JPG, PNG, GIF, and WEBP are allowed");
        }
        
        // Move uploaded file
        if (!move_uploaded_file($image['tmp_name'], $targetPath)) {
            throw new Exception("Failed to upload image");
        }
        
        // Get form data
        $title = $conn->real_escape_string($_POST['title']);
        $author = $conn->real_escape_string($_POST['author']);
        $date = $conn->real_escape_string($_POST['date']);
        $readTime = $conn->real_escape_string($_POST['readTime']);
        $category = $conn->real_escape_string($_POST['category']);
        $excerpt = $conn->real_escape_string($_POST['excerpt']);
        $featured = isset($_POST['featured']) && $_POST['featured'] === 'true' ? 1 : 0;
        
        // Insert into database
        $query = "INSERT INTO blogs (title, author, date, readTime, category, image, excerpt, featured) 
                  VALUES ('$title', '$author', '$date', '$readTime', '$category', '$imageFileName', '$excerpt', $featured)";
        
        if ($conn->query($query)) {
            echo json_encode(['success' => true, 'message' => 'Blog added successfully']);
        } else {
            // Remove uploaded image if database insert fails
            if (file_exists($targetPath)) {
                unlink($targetPath);
            }
            throw new Exception("Database error: " . $conn->error);
        }
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}

// Function to update a blog
function updateBlog() {
    global $conn, $image_path;
    
    try {
        // Validate ID
        if (!isset($_POST['id']) || empty($_POST['id'])) {
            throw new Exception("Blog ID is required");
        }
        
        $id = (int)$_POST['id'];
        
        // Check if blog exists
        $checkQuery = "SELECT * FROM blogs WHERE id = $id";
        $result = $conn->query($checkQuery);
        
        if ($result->num_rows === 0) {
            throw new Exception("Blog not found");
        }
        
        $blog = $result->fetch_assoc();
        $oldImage = $blog['image'];
        
        // Validate required fields
        $requiredFields = ['title', 'author', 'date', 'readTime', 'category', 'excerpt'];
        foreach ($requiredFields as $field) {
            if (!isset($_POST[$field]) || empty($_POST[$field])) {
                throw new Exception("Field '{$field}' is required");
            }
        }
        
        // Get form data
        $title = $conn->real_escape_string($_POST['title']);
        $author = $conn->real_escape_string($_POST['author']);
        $date = $conn->real_escape_string($_POST['date']);
        $readTime = $conn->real_escape_string($_POST['readTime']);
        $category = $conn->real_escape_string($_POST['category']);
        $excerpt = $conn->real_escape_string($_POST['excerpt']);
        $featured = isset($_POST['featured']) && $_POST['featured'] === 'true' ? 1 : 0;
        
        // Process image if uploaded
        $imageFileName = $oldImage;
        if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
            // Process new image upload
            $image = $_FILES['image'];
            $imageFileName = time() . '_' . basename($image['name']);
            $targetPath = $image_path . $imageFileName;
            
            // Check file type
            $allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
            if (!in_array($image['type'], $allowedTypes)) {
                throw new Exception("Invalid file type. Only JPG, PNG, GIF, and WEBP are allowed");
            }
            
            // Move uploaded file
            if (!move_uploaded_file($image['tmp_name'], $targetPath)) {
                throw new Exception("Failed to upload image");
            }
            
            // Remove old image if exists
            if (file_exists($image_path . $oldImage)) {
                unlink($image_path . $oldImage);
            }
        }
        
        // Update database
        $query = "UPDATE blogs SET 
                  title = '$title', 
                  author = '$author', 
                  date = '$date', 
                  readTime = '$readTime', 
                  category = '$category', 
                  image = '$imageFileName', 
                  excerpt = '$excerpt', 
                  featured = $featured 
                  WHERE id = $id";
        
        if ($conn->query($query)) {
            echo json_encode(['success' => true, 'message' => 'Blog updated successfully']);
        } else {
            // If the update failed and we uploaded a new image, remove it
            if ($imageFileName !== $oldImage && file_exists($image_path . $imageFileName)) {
                unlink($image_path . $imageFileName);
            }
            throw new Exception("Database error: " . $conn->error);
        }
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}

// Function to delete a blog
function deleteBlog() {
    global $conn, $image_path;
    
    try {
        // Validate ID
        if (!isset($_POST['id']) || empty($_POST['id'])) {
            throw new Exception("Blog ID is required");
        }
        
        $id = (int)$_POST['id'];
        
        // Get the image filename before deleting
        $query = "SELECT image FROM blogs WHERE id = $id";
        $result = $conn->query($query);
        
        if ($result->num_rows === 0) {
            throw new Exception("Blog not found");
        }
        
        $blog = $result->fetch_assoc();
        $imageName = $blog['image'];
        
        // Delete from database
        $deleteQuery = "DELETE FROM blogs WHERE id = $id";
        
        if ($conn->query($deleteQuery)) {
            // Delete the image file if it exists
            if (!empty($imageName) && file_exists($image_path . $imageName)) {
                unlink($image_path . $imageName);
            }
            
            echo json_encode(['success' => true, 'message' => 'Blog deleted successfully']);
        } else {
            throw new Exception("Database error: " . $conn->error);
        }
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}
?>
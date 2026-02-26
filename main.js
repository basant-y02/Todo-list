// ======================== Global Variables ========================
let input = document.querySelector(".input");
let submitBtn = document.querySelector(".add");
let tasksDiv = document.querySelector(".tasks");
let deleteAllBtn = document.querySelector(".delete-all");
let filesList = document.getElementById("filesList");

// Data structure: array of files
let arrayOfFiles = [];
let currentFileId = null;
// isDragging
let isDragging = false;
// Load data from localStorage on startup
loadFromLocalStorage();

// ======================== Event Listeners ========================

// Add new task
submitBtn.onclick = function () {
    if (!currentFileId) {
        Swal.fire({
            title: 'No file!',
            text: 'Please create a file first.',
            icon: 'info',
            background: '#1a1a2e',
            color: '#e9ecef',
            showConfirmButton: false,
            timer: 1500
        });
        return;
    }
    if (input.value.trim() !== "") {
        addTaskToCurrentFile(input.value.trim());
        input.value = "";
    }
};

// Handle clicks on tasks area (edit, delete, toggle)
tasksDiv.addEventListener("click", (e) => {
    // Edit button
    if (e.target.classList.contains("edit") || e.target.closest(".edit")) {
        const editBtn = e.target.closest(".edit");
        const taskDiv = editBtn.closest(".task");
        const taskId = taskDiv.getAttribute("data-id");
        const currentText = taskDiv.childNodes[0].textContent;

        Swal.fire({
            title: 'Edit task',
            input: 'text',
            inputValue: currentText,
            background: '#1a1a2e',
            color: '#e9ecef',
            confirmButtonColor: 'rgba(103, 140, 255, 0.8)',
            cancelButtonColor: 'rgba(255, 69, 89, 0.8)',
            showCancelButton: true,
            inputValidator: (value) => {
                if (!value) return 'You need to write something!';
            }
        }).then((result) => {
            if (result.isConfirmed) {
                editTaskInCurrentFile(taskId, result.value);
                Swal.fire({
                    title: 'Updated!',
                    text: 'Task has been updated.',
                    icon: 'success',
                    background: '#1a1a2e',
                    color: '#e9ecef',
                    showConfirmButton: false,
                    timer: 1000
                });
            }
        });
    }

    // Delete button
    if (e.target.classList.contains("del") || e.target.closest(".del")) {
        const delBtn = e.target.closest(".del");
        const taskDiv = delBtn.closest(".task");
        const taskId = taskDiv.getAttribute("data-id");

        Swal.fire({
            title: 'Delete task?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            background: '#1a1a2e',
            color: '#e9ecef',
            showCancelButton: true,
            confirmButtonColor: 'rgba(103, 140, 255, 0.8)',
            cancelButtonColor: 'rgba(255, 69, 89, 0.8)',
            confirmButtonText: 'Yes, delete it!'
        }).then((result) => {
            if (result.isConfirmed) {
                deleteTaskFromCurrentFile(taskId);
                taskDiv.remove();
                Swal.fire({
                    title: 'Deleted!',
                    text: 'Task has been deleted.',
                    icon: 'success',
                    background: '#1a1a2e',
                    color: '#e9ecef',
                    showConfirmButton: false,
                    timer: 1000
                });
            }
        });
    }

    // Click on task itself (toggle completion)
    if (e.target.classList.contains("task")) {
        const taskId = e.target.getAttribute("data-id");
        toggleTaskInCurrentFile(taskId);
        e.target.classList.toggle("done");
    }
});

// Delete all tasks in current file
deleteAllBtn.onclick = function() {
    if (!currentFileId) {
        Swal.fire({
            title: 'No file!',
            text: 'Please create a file first.',
            icon: 'info',
            background: '#1a1a2e',
            color: '#e9ecef',
            showConfirmButton: false,
            timer: 1500
        });
        return;
    }

    const currentFile = getCurrentFile();
    if (currentFile.tasks.length > 0) {
        Swal.fire({
            title: 'Are you sure?',
            text: "All tasks in this file will be deleted!",
            icon: 'warning',
            background: '#1a1a2e',
            color: '#e9ecef',
            showCancelButton: true,
            confirmButtonColor: 'rgba(103, 140, 255, 0.8)',
            cancelButtonColor: 'rgba(255, 69, 89, 0.8)',
            confirmButtonText: 'Yes, delete all!'
        }).then((result) => {
            if (result.isConfirmed) {
                deleteAllTasksInCurrentFile();
                Swal.fire({
                    title: 'Deleted!',
                    text: 'All tasks have been deleted.',
                    icon: 'success',
                    background: '#1a1a2e',
                    color: '#e9ecef',
                    showConfirmButton: false,
                    timer: 1000
                });
            }
        });
    } else {
        Swal.fire({
            title: 'No tasks!',
            text: 'There are no tasks to delete.',
            icon: 'info',
            background: '#1a1a2e',
            color: '#e9ecef',
            showConfirmButton: false,
            timer: 1200
        });
    }
};

// ======================== File Functions ========================

function createNewFile() {
    Swal.fire({
        title: 'Create new file',
        input: 'text',
        inputLabel: 'File name',
        inputValue: 'File ' + (arrayOfFiles.length + 1),
        background: '#1a1a2e',
        color: '#e9ecef',
        confirmButtonColor: 'rgba(103, 140, 255, 0.8)',
        cancelButtonColor: 'rgba(255, 69, 89, 0.8)',
        showCancelButton: true,
        confirmButtonText: 'Create',
        cancelButtonText: 'Cancel',
        inputValidator: (value) => {
            if (!value) return 'Please enter a file name';
        }
    }).then((result) => {
        if (result.isConfirmed) {
            const newFile = {
                id: Date.now(),
                name: result.value,
                tasks: []
            };
            arrayOfFiles.push(newFile);
            saveToLocalStorage();
            renderFiles();
            switchFile(newFile.id);
            document.getElementById('addSound').play().catch(err => console.log(err));
        }
    });
}

function renameFile(fileId) {
    const file = arrayOfFiles.find(f => f.id == fileId);
    if (!file) return;

    Swal.fire({
        title: 'Rename file',
        input: 'text',
        inputLabel: 'New file name',
        inputValue: file.name,
        background: '#1a1a2e',
        color: '#e9ecef',
        confirmButtonColor: 'rgba(103, 140, 255, 0.8)',
        cancelButtonColor: 'rgba(255, 69, 89, 0.8)',
        showCancelButton: true,
        confirmButtonText: 'Rename',
        cancelButtonText: 'Cancel',
        inputValidator: (value) => {
            if (!value) return 'Please enter a file name';
        }
    }).then((result) => {
        if (result.isConfirmed) {
            file.name = result.value;
            saveToLocalStorage();
            renderFiles();
            document.getElementById('toggleSound').play().catch(err => console.log(err));
        }
    });
}

function deleteFile(fileId) {
    const file = arrayOfFiles.find(f => f.id == fileId);
    if (!file) return;

    Swal.fire({
        title: `Delete file "${file.name}"?`,
        text: "All tasks inside it will be deleted!",
        icon: 'warning',
        background: '#1a1a2e',
        color: '#e9ecef',
        showCancelButton: true,
        confirmButtonColor: 'rgba(255, 69, 89, 0.8)',
        cancelButtonColor: 'rgba(103, 140, 255, 0.8)',
        confirmButtonText: 'Yes, delete it'
    }).then((result) => {
        if (result.isConfirmed) {
            arrayOfFiles = arrayOfFiles.filter(f => f.id != fileId);
            
            if (currentFileId == fileId) {
                if (arrayOfFiles.length > 0) {
                    currentFileId = arrayOfFiles[0].id;
                } else {
                    currentFileId = null;
                }
            }

            saveToLocalStorage();
            renderFiles();
            renderTasks();

            document.getElementById('deleteSound').play().catch(err => console.log(err));

            if (arrayOfFiles.length === 0) {
                tasksDiv.innerHTML = '<p class="text-white-50 text-center">No files. Create a new file.</p>';
            }
        }
    });
}

function switchFile(fileId) {
    currentFileId = fileId;
    renderFiles();
    renderTasks();
}

function renderFiles() {
    let html = '';
    arrayOfFiles.forEach(file => {
        const isActive = (currentFileId == file.id) ? 'active-file' : '';
        html += `
            <div class="file-item ${isActive}" draggable="true" 
                 ondragstart="dragStartFile(event, ${file.id})" 
                 ondragover="dragOverFile(event)"
                 ondrop="dropFile(event, ${file.id})"
                 onclick="if(!isDragging) switchFile(${file.id})">
                <div class="file-name">
                    <i class="fas fa-folder"></i>
                    <span>${file.name}</span>
                </div>
                <div class="file-actions">
                    <span class="file-edit-btn" onclick="event.stopPropagation(); renameFile(${file.id})" title="Rename file">
                        <i class="fas fa-pen"></i>
                    </span>
                    <span class="file-delete-btn" onclick="event.stopPropagation(); deleteFile(${file.id})" title="Delete file">
                        <i class="fas fa-trash-alt"></i>
                    </span>
                </div>
            </div>
        `;
    });
    filesList.innerHTML = html;
}

function getCurrentFile() {
    return arrayOfFiles.find(f => f.id == currentFileId);
}

// ======================== Task Functions (within current file) ========================

function addTaskToCurrentFile(taskText) {
    const currentFile = getCurrentFile();
    if (!currentFile) return;

    const newTask = {
        id: Date.now(),
        title: taskText,
        completed: false
    };

    currentFile.tasks.push(newTask);
    saveToLocalStorage();

    document.getElementById('addSound').play().catch(err => console.log(err));

    renderTasks();
}

function deleteTaskFromCurrentFile(taskId) {
    const currentFile = getCurrentFile();
    if (!currentFile) return;

    currentFile.tasks = currentFile.tasks.filter(t => t.id != taskId);
    saveToLocalStorage();

    document.getElementById('addSound').play().catch(err => console.log(err));

    renderTasks();
}

function toggleTaskInCurrentFile(taskId) {
    const currentFile = getCurrentFile();
    if (!currentFile) return;

    const task = currentFile.tasks.find(t => t.id == taskId);
    if (task) {
        task.completed = !task.completed;
        saveToLocalStorage();

        document.getElementById('toggleSound').play().catch(err => console.log(err));
    }

    renderTasks();
}

function editTaskInCurrentFile(taskId, newText) {
    const currentFile = getCurrentFile();
    if (!currentFile) return;

    const task = currentFile.tasks.find(t => t.id == taskId);
    if (task) {
        task.title = newText;
        saveToLocalStorage();

        document.getElementById('toggleSound').play().catch(err => console.log(err));
    }

    renderTasks();
}

function deleteAllTasksInCurrentFile() {
    const currentFile = getCurrentFile();
    if (!currentFile) return;

    currentFile.tasks = [];
    saveToLocalStorage();

    document.getElementById('deleteSound').play().catch(err => console.log(err));

    renderTasks();
}

function renderTasks() {
    const currentFile = getCurrentFile();
    
    if (!currentFile || currentFile.tasks.length === 0) {
        tasksDiv.innerHTML = '<p class="text-white-50 text-center">No tasks in this file.</p>';
        return;
    }

    tasksDiv.innerHTML = "";

    currentFile.tasks.forEach((task) => {
        let div = document.createElement("div");
        div.className = task.completed ? "task done" : "task";
        div.setAttribute("data-id", task.id);
        div.setAttribute("draggable", "true");
        div.ondragstart = (e) => dragStartTask(e, task.id, currentFile.id);
        div.ondragover = (e) => e.preventDefault();
        div.ondrop = (e) => dropTask(e, task.id, currentFile.id);
        div.appendChild(document.createTextNode(task.title));

        let btnContainer = document.createElement("div");
        btnContainer.className = "btn-container";

        let editSpan = document.createElement("span");
        editSpan.className = "edit";
        editSpan.innerHTML = '<i class="fas fa-edit"></i> Edit';
        
        let deleteSpan = document.createElement("span");
        deleteSpan.className = "del";
        deleteSpan.innerHTML = '<i class="fas fa-trash-alt"></i> Delete';
        
        btnContainer.appendChild(editSpan);
        btnContainer.appendChild(deleteSpan);
        div.appendChild(btnContainer);
        
        tasksDiv.appendChild(div);
    });
}
// File drag and drop functions
function dragStartFile(event, fileId) {
    isDragging = true;
    event.dataTransfer.setData("text/plain", fileId);
    event.dataTransfer.effectAllowed = "move";
    // Reset dragging flag after a short delay (to allow click to be prevented)
    setTimeout(() => { isDragging = false; }, 200);
    document.getElementById('toggleSound').play().catch(err => console.log(err));
}

function dragOverFile(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    // Add visual feedback
    event.target.closest('.file-item')?.classList.add('drag-over');
    document.getElementById('toggleSound').play().catch(err => console.log(err));
}

function dropFile(event, targetFileId) {
    event.preventDefault();
    isDragging = false;
    // Remove visual feedback
    document.querySelectorAll('.file-item').forEach(el => el.classList.remove('drag-over'));
    
    const draggedFileId = event.dataTransfer.getData("text/plain");
    if (!draggedFileId || draggedFileId == targetFileId) return;

    // Find indices
    const draggedIndex = arrayOfFiles.findIndex(f => f.id == draggedFileId);
    const targetIndex = arrayOfFiles.findIndex(f => f.id == targetFileId);
    if (draggedIndex === -1 || targetIndex === -1) return;

    // Reorder array
    const [draggedFile] = arrayOfFiles.splice(draggedIndex, 1);
    arrayOfFiles.splice(targetIndex, 0, draggedFile);

    // Save and re-render
    saveToLocalStorage();
    renderFiles();
    // If current file was moved, ensure it's still active (currentFileId remains same)
    renderTasks(); // tasks may not change, but re-render anyway
    document.getElementById('toggleSound').play().catch(err => console.log(err));
}

// Task drag and drop functions
function dragStartTask(event, taskId, fileId) {
    isDragging = true;
    event.dataTransfer.setData("text/plain", JSON.stringify({ taskId, fileId }));
    event.dataTransfer.effectAllowed = "move";
    setTimeout(() => { isDragging = false; }, 200);
    document.getElementById('toggleSound').play().catch(err => console.log(err));
}

function dropTask(event, targetTaskId, targetFileId) {
    event.preventDefault();
    isDragging = false;
    // Remove visual feedback
    document.querySelectorAll('.task').forEach(el => el.classList.remove('drag-over'));

    const data = event.dataTransfer.getData("text/plain");
    if (!data) return;
    const { taskId: draggedTaskId, fileId: draggedFileId } = JSON.parse(data);

    // Only allow reorder within the same file
    if (draggedFileId != targetFileId || draggedTaskId == targetTaskId) return;

    const currentFile = getCurrentFile();
    if (!currentFile) return;

    const draggedIndex = currentFile.tasks.findIndex(t => t.id == draggedTaskId);
    const targetIndex = currentFile.tasks.findIndex(t => t.id == targetTaskId);
    if (draggedIndex === -1 || targetIndex === -1) return;

    // Reorder tasks
    const [draggedTask] = currentFile.tasks.splice(draggedIndex, 1);
    currentFile.tasks.splice(targetIndex, 0, draggedTask);

    saveToLocalStorage();
    renderTasks();
    document.getElementById('toggleSound').play().catch(err => console.log(err));
}

// Add drag over handler for tasks container
tasksDiv.addEventListener("dragover", (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    // Add visual feedback to the target task
    const targetTask = e.target.closest('.task');
    if (targetTask) {
        targetTask.classList.add('drag-over');
    }
});

tasksDiv.addEventListener("dragleave", (e) => {
    const targetTask = e.target.closest('.task');
    if (targetTask) {
        targetTask.classList.remove('drag-over');
    }
});
// ======================== Local Storage Functions ========================

function saveToLocalStorage() {
    localStorage.setItem("todoFiles", JSON.stringify(arrayOfFiles));
}

function loadFromLocalStorage() {
    let data = localStorage.getItem("todoFiles");
    if (data) {
        arrayOfFiles = JSON.parse(data);
        if (arrayOfFiles.length > 0) {
            currentFileId = arrayOfFiles[0].id;
        } else {
            createDefaultFile();
        }
    } else {
        createDefaultFile();
    }

    renderFiles();
    renderTasks();
}

function createDefaultFile() {
    const defaultFile = {
        id: Date.now(),
        name: "File 1",
        tasks: []
    };
    arrayOfFiles = [defaultFile];
    currentFileId = defaultFile.id;
    saveToLocalStorage();
}

// ======================== Expose functions to global scope (for onclick) ========================
window.createNewFile = createNewFile;
window.switchFile = switchFile;
window.deleteFile = deleteFile;






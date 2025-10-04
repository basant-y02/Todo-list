let input = document.querySelector(".input");
let submitBtn = document.querySelector(".add");
let tasksDiv = document.querySelector(".tasks");
let deleteAllBtn = document.querySelector(".delete-all");

//Empty Array to store tasks
let arrayOfTasks = [];

// Trigger get data from local storage
getDataFromLocalStorage();

// Check if there are tasks in local storage
if (localStorage.getItem("tasks")) {
    arrayOfTasks = JSON.parse(localStorage.getItem("tasks"));
}

// Add task
submitBtn.onclick = function () {
    if (input.value !== "") {
        addTasktoArray(input.value); //Add Task to Array of Tasks
        input.value = ""; //Empty Input Field
    }
};

// Click on task element
tasksDiv.addEventListener("click", (e) => {
    // Edit Button
    if (e.target.classList.contains("edit")) {
        const taskDiv = e.target.closest(".task");
        const taskId = taskDiv.getAttribute("data-id");
        const currentText = taskDiv.childNodes[0].textContent;

        Swal.fire({
            title: 'Edit Task',
            input: 'text',
            inputValue: currentText,
            background: '#1a1a2e',
            color: '#e9ecef',
            confirmButtonColor: 'rgba(103, 140, 255, 0.8)',
            cancelButtonColor: 'rgba(255, 69, 89, 0.8)',
            showCancelButton: true,
            inputValidator: (value) => {
                if (!value) {
                    return 'You need to write something!'
                }
            }
        }).then((result) => {
            if (result.isConfirmed) {
                editTaskWith(taskId, result.value);
                Swal.fire({
                    title: 'Updated!',
                    text: 'Your task has been updated.',
                    icon: 'success',
                    background: '#1a1a2e',
                    color: '#e9ecef',
                    showConfirmButton: false,
                    timer: 1000
                });
            }
        });
    }
    // Delete Button
    if (e.target.classList.contains("del")) {
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
                const taskDiv = e.target.closest(".task"); // Get the parent task div
                // Remove task from local storage
                deleteTaskWith(taskDiv.getAttribute("data-id"));
                // Remove element from page
                taskDiv.remove();
                Swal.fire({
                    title: 'Deleted!',
                    text: 'Your task has been deleted.',
                    icon: 'success',
                    background: '#1a1a2e',
                    color: '#e9ecef',
                    showConfirmButton: false,
                    timer: 1000
                });
            }
        });
    }
    // Task Element
    if (e.target.classList.contains("task")) {
        // Toggle Completed for the task
        toggleTaskWith(e.target.getAttribute("data-id"));
        // Toggle Done Class
        e.target.classList.toggle("done");
    }
});

deleteAllBtn.onclick = function() {
    if (arrayOfTasks.length > 0) {
        Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            background: '#1a1a2e',
            color: '#e9ecef',
            showCancelButton: true,
            confirmButtonColor: 'rgba(103, 140, 255, 0.8)',
            cancelButtonColor: 'rgba(255, 69, 89, 0.8)',
            confirmButtonText: 'Yes, delete all!'
        }).then((result) => {
            if (result.isConfirmed) {
                deleteAllTasks();
                Swal.fire({
                    title: 'Deleted!',
                    text: 'All tasks have been deleted.',
                    icon: 'success',
                    background: '#1a1a2e',
                    color: '#e9ecef',
                    showConfirmButton: false,
                    timer: 1000,
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
            timer: 1200,
        });
    }
}

// Function to add task to array of tasks
function addTasktoArray(taskText) {
    const addSound = document.getElementById('addSound');
    // Create task object
    const task = {
        id: Date.now(),
        title: taskText,
        completed: false,
    };
    // Push task to array of tasks
    arrayOfTasks.push(task);
    // Play add sound
    addSound.currentTime = 0;
    addSound.play().catch(err => console.log('Sound play failed:', err));
    // Add tasks to page
    addElementsToPageFrom(arrayOfTasks);
    // Add tasks to local storage
    addDataToLocalStorageFrom(arrayOfTasks);
}

// Function to add tasks to page
function addElementsToPageFrom(arrayOfTasks) {
    // Empty tasks div
    tasksDiv.innerHTML = "";
    // Looping on array of tasks
    arrayOfTasks.forEach((task) => {
        // Create main div
        let div = document.createElement("div");
        div.className = "task";
        if (task.completed) {
            div.className = "task done";
        }
        div.setAttribute("data-id", task.id);
        div.appendChild(document.createTextNode(task.title));

        // Create Button Container
        let btnContainer = document.createElement("div");
        btnContainer.className = "btn-container";
        btnContainer.style.cssText = `
            float: right;
            display: flex;
            gap: 0.5rem;
        `;

        // Create Edit Button
        let editSpan = document.createElement("span");
        editSpan.className = "edit";
        editSpan.innerHTML = '<i class="fas fa-edit"></i> Edit';
        
        // Create Delete Button
        let deleteSpan = document.createElement("span");
        deleteSpan.className = "del";
        deleteSpan.innerHTML = '<i class="fas fa-trash-alt"></i> Delete';
        
        // Append buttons to container
        btnContainer.appendChild(editSpan);
        btnContainer.appendChild(deleteSpan);
        
        // Append button container to main div
        div.appendChild(btnContainer);
        
        // Add task div to tasks container
        tasksDiv.appendChild(div);
    });
}

// Function to add data to local storage
function addDataToLocalStorageFrom(arrayOfTasks) {
    window.localStorage.setItem("tasks", JSON.stringify(arrayOfTasks));
}

// Function to get data from local storage
function getDataFromLocalStorage() {
    let data = window.localStorage.getItem("tasks");
    if (data) {
        let tasks = JSON.parse(data);
        addElementsToPageFrom(tasks);
    }
}

// Function to delete task from local storage
function deleteTaskWith(taskId) {
    const deleteSound = document.getElementById('deleteSound');
    
    // Play delete sound
    deleteSound.currentTime = 0;
    deleteSound.play().catch(err => console.log('Sound play failed:', err));
    
    // Remove task from array
    arrayOfTasks = arrayOfTasks.filter((task) => task.id != taskId);
    addDataToLocalStorageFrom(arrayOfTasks);
}

// Function to toggle task
function toggleTaskWith(taskId) {
    const toggleSound = document.getElementById('toggleSound');
    
    for (let i = 0; i < arrayOfTasks.length; i++) {
        if (arrayOfTasks[i].id == taskId) {
            arrayOfTasks[i].completed = !arrayOfTasks[i].completed;
            // Play sound when toggling
            toggleSound.currentTime = 0; // Reset sound to start
            toggleSound.play().catch(err => console.log('Sound play failed:', err));
        }
    }
    addDataToLocalStorageFrom(arrayOfTasks);
}

// Function to delete all tasks
function deleteAllTasks() {
    const deleteSound = document.getElementById('deleteSound');
    
    if (arrayOfTasks.length > 0) {
        // Play delete sound
        deleteSound.currentTime = 0;
        deleteSound.volume = 0.5; // Slightly lower volume for multiple deletes
        deleteSound.play().catch(err => console.log('Sound play failed:', err));
        
        // Clear tasks array
        arrayOfTasks = [];
        
        // Clear tasks from page
        tasksDiv.innerHTML = "";
        
        // Clear local storage
        localStorage.removeItem("tasks");
    }
}

// Add this new function for editing tasks
function editTaskWith(taskId, newText) {
    const toggleSound = document.getElementById('toggleSound');
    
    for (let i = 0; i < arrayOfTasks.length; i++) {
        if (arrayOfTasks[i].id == taskId) {
            arrayOfTasks[i].title = newText;
            // Play sound when editing
            toggleSound.currentTime = 0;
            toggleSound.play().catch(err => console.log('Sound play failed:', err));
        }
    }
    addDataToLocalStorageFrom(arrayOfTasks);
    addElementsToPageFrom(arrayOfTasks);
}


// ======================== المتغيرات العامة ========================
let input = document.querySelector(".input");
let submitBtn = document.querySelector(".add");
let tasksDiv = document.querySelector(".tasks");
let deleteAllBtn = document.querySelector(".delete-all");
let filesContainer = document.querySelector(".files-container");

// هيكل البيانات الجديد: مصفوفة من الملفات
let arrayOfFiles = [];
let currentFileId = null;

// تحميل البيانات من localStorage عند البدء
loadFromLocalStorage();

// ======================== الأحداث ========================

// إضافة مهمة جديدة
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

// التعامل مع النقر على منطقة المهام (تعديل، حذف، تبديل الحالة)
tasksDiv.addEventListener("click", (e) => {
    // زر التعديل
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
                if (!value) return 'Something needs to be written!';
            }
        }).then((result) => {
            if (result.isConfirmed) {
                editTaskInCurrentFile(taskId, result.value);
                Swal.fire({
                    title: 'Updated!',
                    text: 'The task was successfully modified',
                    icon: 'success',
                    background: '#1a1a2e',
                    color: '#e9ecef',
                    showConfirmButton: false,
                    timer: 1000
                });
            }
        });
    }

    // زر الحذف
    if (e.target.classList.contains("del") || e.target.closest(".del")) {
        const delBtn = e.target.closest(".del");
        const taskDiv = delBtn.closest(".task");
        const taskId = taskDiv.getAttribute("data-id");

        Swal.fire({
            title: 'Delete the task?',
            text: "You will not be able to undo this!",
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
                    text: 'The task was deleted',
                    icon: 'success',
                    background: '#1a1a2e',
                    color: '#e9ecef',
                    showConfirmButton: false,
                    timer: 1000
                });
            }
        });
    }

    // النقر على المهمة نفسها (تبديل الحالة)
    if (e.target.classList.contains("task")) {
        const taskId = e.target.getAttribute("data-id");
        toggleTaskInCurrentFile(taskId);
        e.target.classList.toggle("done");
    }
});

// حذف جميع المهام في الملف النشط
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
                    text: 'All tasks have been deleted',
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

// ======================== دوال الملفات (Files) ========================

// دالة لإنشاء ملف جديد
function createNewFile() {
    Swal.fire({
        title: 'Create a new file',
        input: 'text',
        inputLabel: 'File Name',
        inputValue: 'File ' + (arrayOfFiles.length + 1),
        background: '#1a1a2e',
        color: '#e9ecef',
        confirmButtonColor: 'rgba(103, 140, 255, 0.8)',
        cancelButtonColor: 'rgba(255, 69, 89, 0.8)',
        showCancelButton: true,
        confirmButtonText: 'create',
        cancelButtonText: 'cancel',
        inputValidator: (value) => {
            if (!value) return 'Please enter the file name';
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
            // التبديل إلى الملف الجديد
            switchFile(newFile.id);
            // تشغيل صوت
            document.getElementById('addSound').play().catch(err => console.log(err));
        }
    });
}

// دالة لحذف ملف
function deleteFile(fileId) {
    const file = arrayOfFiles.find(f => f.id == fileId);
    if (!file) return;

    Swal.fire({
        title: `Delete file "${file.name}"؟`,
        text: "All tasks within it will be deleted!",
        icon: 'warning',
        background: '#1a1a2e',
        color: '#e9ecef',
        showCancelButton: true,
        confirmButtonColor: 'rgba(255, 69, 89, 0.8)',
        cancelButtonColor: 'rgba(103, 140, 255, 0.8)',
        confirmButtonText: 'Yes, delete it'
    }).then((result) => {
        if (result.isConfirmed) {
            // إزالة الملف من المصفوفة
            arrayOfFiles = arrayOfFiles.filter(f => f.id != fileId);
            
            // إذا كان الملف المحذوف هو النشط، ننتقل إلى أول ملف (إن وجد)
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

            // تشغيل صوت الحذف
            document.getElementById('deleteSound').play().catch(err => console.log(err));

            // إذا لم يتبق أي ملفات، نعرض رسالة
            if (arrayOfFiles.length === 0) {
                tasksDiv.innerHTML = '<p class="text-white-50 text-center">No files found. Create a new file.</p>';
            }
        }
    });
}

// دالة للتبديل بين الملفات
function switchFile(fileId) {
    currentFileId = fileId;
    renderFiles();  // لتحديث التبويب النشط
    renderTasks();  // لعرض مهام الملف الجديد
}

// دالة لعرض الملفات في الأعلى (تبويبات)
function renderFiles() {
    let html = '';
    
    // زر إضافة ملف جديد
    html += `<button class="btn add-file-btn" style="background: rgba(103, 140, 255, 0.2); border: 1px solid rgba(103, 140, 255, 0.3); color: #e9ecef;" onclick="createNewFile()"><i class="fas fa-plus"></i> New file</button>`;

    // عرض كل ملف
    arrayOfFiles.forEach(file => {
        const isActive = (currentFileId == file.id) ? 'active-file' : '';
        html += `
            <div class="file-tab d-flex align-items-center gap-2 px-3 py-2 rounded ${isActive}" style="background: ${isActive ? 'rgba(103, 140, 255, 0.3)' : 'rgba(255,255,255,0.05)'}; border: 1px solid rgba(255,255,255,0.1); cursor: pointer;" onclick="switchFile(${file.id})">
                <span><i class="fas fa-folder me-1"></i>${file.name}</span>
                <span class="file-delete-btn" onclick="event.stopPropagation(); deleteFile(${file.id})" style="color: #ff6b6b; margin-left: 8px;">
                    <i class="fas fa-trash-alt"></i>
                </span>
            </div>
        `;
    });

    filesContainer.innerHTML = html;
}

// دالة مساعدة للحصول على الملف النشط
function getCurrentFile() {
    return arrayOfFiles.find(f => f.id == currentFileId);
}

// ======================== دوال المهام (Tasks) داخل الملف النشط ========================

// إضافة مهمة إلى الملف النشط
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

    // تشغيل صوت الإضافة
    document.getElementById('addSound').play().catch(err => console.log(err));

    renderTasks();
}

// حذف مهمة من الملف النشط
function deleteTaskFromCurrentFile(taskId) {
    const currentFile = getCurrentFile();
    if (!currentFile) return;

    currentFile.tasks = currentFile.tasks.filter(t => t.id != taskId);
    saveToLocalStorage();

    // تشغيل صوت الحذف
    document.getElementById('deleteSound').play().catch(err => console.log(err));

    renderTasks();
}

// تبديل حالة المهمة (completed)
function toggleTaskInCurrentFile(taskId) {
    const currentFile = getCurrentFile();
    if (!currentFile) return;

    const task = currentFile.tasks.find(t => t.id == taskId);
    if (task) {
        task.completed = !task.completed;
        saveToLocalStorage();

        // تشغيل صوت التبديل
        document.getElementById('toggleSound').play().catch(err => console.log(err));
    }

    renderTasks();
}

// تعديل نص المهمة
function editTaskInCurrentFile(taskId, newText) {
    const currentFile = getCurrentFile();
    if (!currentFile) return;

    const task = currentFile.tasks.find(t => t.id == taskId);
    if (task) {
        task.title = newText;
        saveToLocalStorage();

        // تشغيل صوت التعديل (نفس صوت التبديل)
        document.getElementById('toggleSound').play().catch(err => console.log(err));
    }

    renderTasks();
}

// حذف جميع المهام في الملف النشط
function deleteAllTasksInCurrentFile() {
    const currentFile = getCurrentFile();
    if (!currentFile) return;

    currentFile.tasks = [];
    saveToLocalStorage();

    // تشغيل صوت الحذف
    document.getElementById('deleteSound').play().catch(err => console.log(err));

    renderTasks();
}

// دالة عرض المهام الخاصة بالملف النشط في الصفحة
function renderTasks() {
    const currentFile = getCurrentFile();
    
    if (!currentFile || currentFile.tasks.length === 0) {
        tasksDiv.innerHTML = '<p class="text-white-50 text-center">There are no tasks in this file.</p>';
        return;
    }

    tasksDiv.innerHTML = "";

    currentFile.tasks.forEach((task) => {
        // إنشاء div المهمة
        let div = document.createElement("div");
        div.className = task.completed ? "task done" : "task";
        div.setAttribute("data-id", task.id);
        div.appendChild(document.createTextNode(task.title));

        // حاوية الأزرار
        let btnContainer = document.createElement("div");
        btnContainer.className = "btn-container";
        btnContainer.style.cssText = `
            float: right;
            display: flex;
            gap: 0.5rem;
        `;

        // زر التعديل
        let editSpan = document.createElement("span");
        editSpan.className = "edit";
        editSpan.innerHTML = '<i class="fas fa-edit"></i> Edit';
        
        // زر الحذف
        let deleteSpan = document.createElement("span");
        deleteSpan.className = "del";
        deleteSpan.innerHTML = '<i class="fas fa-trash-alt"></i> Delete';
        
        btnContainer.appendChild(editSpan);
        btnContainer.appendChild(deleteSpan);
        div.appendChild(btnContainer);
        
        tasksDiv.appendChild(div);
    });
}

// ======================== دوال الحفظ والتخزين المحلي ========================

// حفظ البيانات الكاملة في localStorage
function saveToLocalStorage() {
    localStorage.setItem("todoFiles", JSON.stringify(arrayOfFiles));
}

// تحميل البيانات من localStorage
function loadFromLocalStorage() {
    let data = localStorage.getItem("todoFiles");
    if (data) {
        arrayOfFiles = JSON.parse(data);
        // إذا كان هناك ملفات، نختار أول ملف كافتراضي
        if (arrayOfFiles.length > 0) {
            currentFileId = arrayOfFiles[0].id;
        } else {
            // لا توجد ملفات، ننشئ ملفاً افتراضياً
            createDefaultFile();
        }
    } else {
        // أول استخدام: إنشاء ملف افتراضي
        createDefaultFile();
    }

    renderFiles();
    renderTasks();
}

// إنشاء ملف افتراضي إذا لم يكن هناك أي ملفات
function createDefaultFile() {
    const defaultFile = {
        id: Date.now(),
        name: "file 1",
        tasks: []
    };
    arrayOfFiles = [defaultFile];
    currentFileId = defaultFile.id;
    saveToLocalStorage();
}

// ======================== تصدير الدوال للنطاق العام (للاستخدام في onclick) ========================
window.createNewFile = createNewFile;
window.switchFile = switchFile;
window.deleteFile = deleteFile;

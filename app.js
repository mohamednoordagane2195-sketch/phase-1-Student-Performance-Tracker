// Authentication Check
function checkAuth() {
    const session = localStorage.getItem('userSession');
    if (!session) {
        window.location.href = 'login.html';
        return false;
    }
    const user = JSON.parse(session);
    // Display logged in user name if element exists
    const userDisplay = document.getElementById('user-name-display');
    if (userDisplay) userDisplay.textContent = user.name;
    return true;
}

// Configuration
const API_URL = 'http://localhost:3000';

// State Management
let students = [];
let courses = [];
let marks = [];
let programs = [];
let semesters = [];

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    if (checkAuth()) {
        initializeApp();
        setupEventListeners();
    }
});

async function initializeApp() {
    // Set up tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            const tabId = this.getAttribute('data-tab');
            switchTab(tabId);
        });
    });

    // Touch enhancements
    document.querySelectorAll('.tab-btn, .btn, .action-btn').forEach(btn => {
        btn.addEventListener('touchstart', function () {
            this.classList.add('touch-active');
        });

        btn.addEventListener('touchend', function () {
            this.classList.remove('touch-active');
        });
    });

    // Initial Data Load
    await fetchAllData();
    switchTab('dashboard');
}

// Data Fetching Helper
async function fetchData(endpoint) {
    try {
        const response = await fetch(`${API_URL}/${endpoint}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error(`Error fetching ${endpoint}:`, error);
        showNotification(`Failed to load ${endpoint}. Is json-server running?`, 'danger');
        return [];
    }
}

async function postData(endpoint, data) {
    try {
        const response = await fetch(`${API_URL}/${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error(`Error posting to ${endpoint}:`, error);
        showNotification('Failed to save data.', 'danger');
        return null;
    }
}

async function updateData(endpoint, id, data) {
    try {
        const response = await fetch(`${API_URL}/${endpoint}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error(`Error updating ${endpoint}/${id}:`, error);
        showNotification('Failed to update data.', 'danger');
        return null;
    }
}

async function deleteData(endpoint, id) {
    try {
        const response = await fetch(`${API_URL}/${endpoint}/${id}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return true;
    } catch (error) {
        console.error(`Error deleting from ${endpoint}:`, error);
        showNotification('Failed to delete data.', 'danger');
        return false;
    }
}

async function fetchAllData() {
    students = await fetchData('students');
    courses = await fetchData('courses');
    marks = await fetchData('marks');
    programs = await fetchData('programs');
    semesters = await fetchData('semesters');
    updateDashboard();
}

function switchTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-tab') === tabId) {
            btn.classList.add('active');
        }
    });

    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(tabId).classList.add('active');

    switch (tabId) {
        case 'dashboard': updateDashboard(); break;
        case 'students': renderStudentsTable(); break;
        case 'courses': renderCoursesTable(); break;
        case 'enter-marks': renderMarksTable(); break;
        case 'results': populateStudentSelect('results-student-select'); break;
        case 'analytics': renderAnalytics(); break;
    }
}

function updateDashboard() {
    if (document.getElementById('total-students')) document.getElementById('total-students').textContent = students.length;
    if (document.getElementById('total-courses')) document.getElementById('total-courses').textContent = courses.length;

    if (marks.length > 0) {
        const passRate = (marks.filter(m => m.status === 'Pass').length / marks.length * 100).toFixed(1);
        if (document.getElementById('pass-rate')) document.getElementById('pass-rate').textContent = `${passRate}%`;

        let totalGPA = 0;
        let studentCount = 0;

        students.forEach(student => {
            const studentMarks = marks.filter(m => m.studentId === student.id);
            if (studentMarks.length > 0) {
                let totalPoints = 0;
                let totalCredits = 0;
                studentMarks.forEach(record => {
                    const course = courses.find(c => c.id === record.courseId);
                    if (course) {
                        let points = { 'A': 4, 'B': 3, 'C': 2, 'D': 1 }[record.grade] || 0;
                        totalPoints += points * course.credits;
                        totalCredits += course.credits;
                    }
                });
                if (totalCredits > 0) {
                    totalGPA += totalPoints / totalCredits;
                    studentCount++;
                }
            }
        });

        const avgGPA = studentCount > 0 ? (totalGPA / studentCount).toFixed(2) : '0.00';
        if (document.getElementById('avg-gpa')) document.getElementById('avg-gpa').textContent = avgGPA;
    }

    updateMiniCharts();
    const lastUpdatedEl = document.getElementById('last-updated');
    if (lastUpdatedEl) {
        lastUpdatedEl.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
}

function updateMiniCharts() {
    const gradeCtx = document.getElementById('gradeDistributionChart')?.getContext('2d');
    if (gradeCtx) {
        if (window.gradeChart) window.gradeChart.destroy();
        const gradeCounts = { A: 0, B: 0, C: 0, D: 0, F: 0 };
        marks.forEach(m => { if (m.grade in gradeCounts) gradeCounts[m.grade]++; });

        window.gradeChart = new Chart(gradeCtx, {
            type: 'doughnut',
            data: {
                labels: ['A', 'B', 'C', 'D', 'F'],
                datasets: [{
                    data: Object.values(gradeCounts),
                    backgroundColor: ['#1cc88a', '#36b9cc', '#f6c23e', '#e74a3b', '#858796'],
                    borderWidth: 1
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, cutout: '70%' }
        });
    }

    const trendCtx = document.getElementById('performanceTrendChart')?.getContext('2d');
    if (trendCtx) {
        if (window.trendChart) window.trendChart.destroy();
        window.trendChart = new Chart(trendCtx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    label: 'Avg Score',
                    data: [65, 68, 72, 75, 78, 80],
                    borderColor: '#4e73df',
                    backgroundColor: 'rgba(78, 115, 223, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, max: 100 } } }
        });
    }
}

function renderStudentsTable(searchTerm = '', programFilter = 'all') {
    const tbody = document.querySelector('#students-table tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    let filtered = students;
    if (searchTerm) {
        filtered = filtered.filter(s => s.fullName.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    if (programFilter !== 'all') {
        filtered = filtered.filter(s => s.program === programFilter);
    }

    filtered.forEach(s => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${s.id}</td>
            <td class="font-weight-bold">${s.regNumber}</td>
            <td>${s.fullName}</td>
            <td>${s.email}</td>
            <td><span class="badge badge-program">${s.program}</span></td>
            <td>Y${s.year} S${s.semester}</td>
            <td><span class="status status-${s.status.toLowerCase()}">${s.status}</span></td>
            <td>
                <button class="icon-btn edit-btn" onclick="editStudent('${s.id}')"><i class="fas fa-edit"></i></button>
                <button class="icon-btn delete-btn" onclick="deleteStudent('${s.id}')"><i class="fas fa-trash"></i></button>
                <button class="icon-btn view-btn" onclick="viewStudentDetails('${s.id}')"><i class="fas fa-eye"></i></button>
            </td>
        `;
        tbody.appendChild(row);
    });
    if (document.getElementById('student-count')) document.getElementById('student-count').textContent = filtered.length;
}

async function addStudent(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newId = (students.length > 0 ? Math.max(...students.map(s => parseInt(s.id))) + 1 : 1).toString();
    const student = {
        id: newId,
        regNumber: formData.get('regNumber'),
        fullName: formData.get('fullName'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        program: formData.get('program'),
        admissionYear: formData.get('admissionYear'),
        year: formData.get('year'),
        semester: formData.get('semester'),
        status: 'Active',
        joinDate: new Date().toISOString().split('T')[0]
    };

    if (await postData('students', student)) {
        await fetchAllData();
        closeModal('add-student-modal');
        renderStudentsTable();
        showNotification('Student added', 'success');
    }
}

async function updateStudent(e) {
    e.preventDefault();
    const id = e.target.querySelector('#edit-student-id').value;
    const data = {
        regNumber: e.target.querySelector('#edit-regNumber').value,
        fullName: e.target.querySelector('#edit-fullName').value,
        email: e.target.querySelector('#edit-email').value,
        phone: e.target.querySelector('#edit-phone').value,
        program: e.target.querySelector('#edit-program').value,
        status: e.target.querySelector('#edit-status').value,
        year: e.target.querySelector('#edit-year').value,
        semester: e.target.querySelector('#edit-semester').value
    };

    if (await updateData('students', id, data)) {
        await fetchAllData();
        closeModal('edit-student-modal');
        renderStudentsTable();
        showNotification('Student updated', 'success');
    }
}

async function deleteStudent(id) {
    if (confirm('Delete student?')) {
        if (await deleteData('students', id)) {
            await fetchAllData();
            renderStudentsTable();
            showNotification('Student deleted', 'success');
        }
    }
}

function renderCoursesTable(searchTerm = '', semesterFilter = 'all') {
    const tbody = document.querySelector('#courses-table tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    let filtered = courses;
    if (searchTerm) {
        filtered = filtered.filter(c =>
            c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.code.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }
    if (semesterFilter !== 'all') {
        filtered = filtered.filter(c => `${c.year}.${c.semester}` == semesterFilter);
    }

    filtered.forEach(c => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${c.code}</td>
            <td>${c.name}</td>
            <td>${c.program}</td>
            <td>${c.year}.${c.semester}</td>
            <td>${c.credits}</td>
            <td><span class="status status-${(c.status || 'active').toLowerCase()}">${c.status || 'Active'}</span></td>
            <td>
                <button class="icon-btn edit-btn" onclick="editCourse('${c.id}')"><i class="fas fa-edit"></i></button>
                <button class="icon-btn delete-btn" onclick="deleteCourse('${c.id}')"><i class="fas fa-trash"></i></button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

async function addCourse(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const course = {
        id: 'c' + Date.now(),
        code: formData.get('code'),
        name: formData.get('name'),
        program: formData.get('program'),
        credits: parseInt(formData.get('credits')),
        year: formData.get('year'),
        semester: formData.get('semester'),
        status: formData.get('status')
    };
    if (await postData('courses', course)) {
        await fetchAllData();
        closeModal('add-course-modal');
        renderCoursesTable();
        showNotification('Course added successfully', 'success');
    }
}

function editCourse(id) {
    const c = courses.find(course => course.id === id);
    if (c) {
        document.getElementById('edit-course-id').value = c.id;
        document.getElementById('edit-course-code').value = c.code;
        document.getElementById('edit-course-name').value = c.name;
        document.getElementById('edit-course-program').value = c.program;
        document.getElementById('edit-course-credits').value = c.credits;
        document.getElementById('edit-course-year').value = c.year;
        document.getElementById('edit-course-semester').value = c.semester;
        document.getElementById('edit-course-status').value = c.status || 'Active';
        openModal('edit-course-modal');
    }
}

async function updateCourse(e) {
    e.preventDefault();
    const id = document.getElementById('edit-course-id').value;
    const formData = new FormData(e.target);
    const data = {
        code: formData.get('code'),
        name: formData.get('name'),
        program: formData.get('program'),
        credits: parseInt(formData.get('credits')),
        year: formData.get('year'),
        semester: formData.get('semester'),
        status: formData.get('status')
    };

    if (await updateData('courses', id, data)) {
        await fetchAllData();
        closeModal('edit-course-modal');
        renderCoursesTable();
        showNotification('Course updated successfully', 'success');
    }
}

async function deleteCourse(id) {
    if (confirm('Are you sure you want to delete this course?')) {
        if (await deleteData('courses', id)) {
            await fetchAllData();
            renderCoursesTable();
            showNotification('Course deleted successfully', 'success');
        }
    }
}

function renderMarksTable() {
    const tbody = document.querySelector('#marks-table tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    marks.slice(-10).reverse().forEach(m => {
        const s = students.find(s => s.id === m.studentId);
        const c = courses.find(c => c.id === m.courseId);
        if (s && c) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${s.fullName}</td>
                <td>${c.name}</td>
                <td>${m.cat1}</td>
                <td>${m.cat2}</td>
                <td>${m.cat1 + m.cat2}</td>
                <td>${m.exam}</td>
                <td class="font-weight-bold">${m.total}</td>
                <td><span class="badge badge-grade grade-${m.grade}">${m.grade}</span></td>
                <td><span class="status status-${m.status.toLowerCase()}">${m.status}</span></td>
                <td><button class="icon-btn delete-btn" onclick="deleteMark('${m.id}')"><i class="fas fa-trash"></i></button></td>
            `;
            tbody.appendChild(row);
        }
    });
}

async function addMarks(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const cat1 = parseFloat(formData.get('cat1')) || 0;
    const cat2 = parseFloat(formData.get('cat2')) || 0;
    const exam = parseFloat(formData.get('main_exam')) || 0;
    const total = cat1 + cat2 + exam;
    let grade = '';
    let status = '';

    if (total >= 70) { grade = 'A'; status = 'Excellent'; }
    else if (total >= 60) { grade = 'B'; status = 'Good'; }
    else if (total >= 50) { grade = 'C'; status = 'Average'; }
    else if (total >= 40) { grade = 'D'; status = 'Pass'; }
    else { grade = 'F'; status = 'Fail'; }

    const mark = {
        id: 'm' + Date.now(),
        studentId: document.getElementById('marks-student-select').value,
        courseId: document.getElementById('marks-course-select').value,
        cat1,
        cat2,
        exam,
        total,
        grade,
        status: status
    };

    if (await postData('marks', mark)) {
        await fetchAllData();
        closeModal('add-marks-modal');
        renderMarksTable();
        showNotification('Marks added', 'success');
        e.target.reset();
        document.getElementById('cat-total').textContent = '0';
        document.getElementById('grand-total').textContent = '0';
        document.getElementById('preview-total').textContent = '0%';
        document.getElementById('preview-grade').textContent = '-';
        document.getElementById('preview-status').textContent = '-';
    }
}

function handleMarksInput(e) {
    const form = document.getElementById('add-marks-form');
    if (!form) return;

    const cat1 = parseFloat(form.cat1.value) || 0;
    const cat2 = parseFloat(form.cat2.value) || 0;
    const exam = parseFloat(form.main_exam.value) || 0;

    const catTotal = cat1 + cat2;
    const grandTotal = catTotal + exam;

    document.getElementById('cat-total').textContent = catTotal;
    document.getElementById('grand-total').textContent = grandTotal;
    document.getElementById('preview-total').textContent = grandTotal + '%';

    let grade = '-';
    let status = '-';

    if (grandTotal >= 70) { grade = 'A'; status = 'Excellent'; }
    else if (grandTotal >= 60) { grade = 'B'; status = 'Good'; }
    else if (grandTotal >= 50) { grade = 'C'; status = 'Average'; }
    else if (grandTotal >= 40) { grade = 'D'; status = 'Pass'; }
    else { grade = 'F'; status = 'Fail'; }

    document.getElementById('preview-grade').textContent = grade;
    document.getElementById('preview-status').textContent = status;

    // Update colors based on status
    const statusEl = document.getElementById('preview-status');
    if (status === 'Fail') statusEl.style.color = '#e74a3b';
    else if (status === 'Excellent') statusEl.style.color = '#4e73df';
    else if (status === 'Good') statusEl.style.color = '#36b9cc';
    else if (status === 'Average') statusEl.style.color = '#f6c23e';
    else if (status === 'Pass') statusEl.style.color = '#1cc88a';
    else statusEl.style.color = '#444';
}

async function deleteMark(id) {
    if (confirm('Delete mark?')) {
        if (await deleteData('marks', id)) {
            await fetchAllData();
            renderMarksTable();
            showNotification('Mark deleted', 'success');
        }
    }
}

function renderAnalytics() {
    const programData = {};
    programs.forEach(p => programData[p.name] = { totalGPA: 0, count: 0 });

    students.forEach(student => {
        const studentMarks = marks.filter(m => m.studentId === student.id);
        if (studentMarks.length > 0) {
            let totalPoints = 0;
            let totalCredits = 0;
            studentMarks.forEach(record => {
                const course = courses.find(c => c.id === record.courseId);
                if (course) {
                    let points = { 'A': 4, 'B': 3, 'C': 2, 'D': 1 }[record.grade] || 0;
                    totalPoints += points * course.credits;
                    totalCredits += course.credits;
                }
            });
            if (totalCredits > 0 && programData[student.program]) {
                programData[student.program].totalGPA += totalPoints / totalCredits;
                programData[student.program].count++;
            }
        }
    });

    const programLabels = Object.keys(programData);
    const programAverages = programLabels.map(label =>
        programData[label].count > 0 ? (programData[label].totalGPA / programData[label].count).toFixed(2) : 0
    );

    const progCtx = document.getElementById('programPerformanceChart')?.getContext('2d');
    if (progCtx) {
        if (window.progChart) window.progChart.destroy();
        window.progChart = new Chart(progCtx, {
            type: 'bar',
            data: {
                labels: programLabels,
                datasets: [{
                    label: 'Average GPA',
                    data: programAverages,
                    backgroundColor: '#4e73df'
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
        });
    }

    const yearData = { '1': 0, '2': 0, '3': 0, '4': 0 };
    students.forEach(s => { if (yearData[s.year] !== undefined) yearData[s.year]++; });

    const studentProgCtx = document.getElementById('studentProgressionChart')?.getContext('2d');
    if (studentProgCtx) {
        if (window.studentProgChart) window.studentProgChart.destroy();
        window.studentProgChart = new Chart(studentProgCtx, {
            type: 'pie',
            data: {
                labels: ['Year 1', 'Year 2', 'Year 3', 'Year 4'],
                datasets: [{
                    data: Object.values(yearData),
                    backgroundColor: ['#4e73df', '#1cc88a', '#36b9cc', '#f6c23e']
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }

    const courseStats = courses.map(c => {
        const cMarks = marks.filter(m => m.courseId === c.id);
        const passRate = cMarks.length > 0 ? (cMarks.filter(m => m.status === 'Pass' || m.total >= 40).length / cMarks.length * 100) : 100;
        return { name: c.name, passRate };
    }).sort((a, b) => a.passRate - b.passRate).slice(0, 5);

    const diffCtx = document.getElementById('courseDifficultyChart')?.getContext('2d');
    if (diffCtx) {
        if (window.diffChart) window.diffChart.destroy();
        window.diffChart = new Chart(diffCtx, {
            type: 'bar',
            data: {
                labels: courseStats.map(s => s.name),
                datasets: [{
                    label: 'Pass Rate %',
                    data: courseStats.map(s => s.passRate.toFixed(1)),
                    backgroundColor: '#e74a3b'
                }]
            },
            options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
        });
    }

    // 4. Course Performance (Average Score per Course)
    const coursePerformanceData = courses.map(c => {
        const cMarks = marks.filter(m => m.courseId === c.id);
        const avgScore = cMarks.length > 0 ? (cMarks.reduce((acc, m) => acc + m.total, 0) / cMarks.length) : 0;
        return { name: c.code, avgScore };
    }).filter(c => c.avgScore > 0).slice(0, 8);

    const coursePerfCtx = document.getElementById('coursePerformanceChart')?.getContext('2d');
    if (coursePerfCtx) {
        if (window.coursePerfChart) window.coursePerfChart.destroy();
        window.coursePerfChart = new Chart(coursePerfCtx, {
            type: 'line',
            data: {
                labels: coursePerformanceData.map(c => c.name),
                datasets: [{
                    label: 'Average Score',
                    data: coursePerformanceData.map(c => c.avgScore.toFixed(1)),
                    borderColor: '#36b9cc',
                    backgroundColor: 'rgba(54, 185, 204, 0.1)',
                    tension: 0.3,
                    fill: true
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }

    if (programAverages.length > 0) {
        const avgGPAs = programAverages.map(v => parseFloat(v));
        const maxGPA = Math.max(...avgGPAs);
        const topProg = programLabels[avgGPAs.indexOf(maxGPA)];
        if (document.getElementById('top-program')) document.getElementById('top-program').textContent = topProg || 'N/A';
        const trendEl = document.getElementById('performance-trend');
        if (trendEl) trendEl.textContent = `Avg: ${(avgGPAs.reduce((a, b) => a + b, 0) / avgGPAs.length).toFixed(2)}`;
    }
}

// TRANSCRIPT FUNCTIONALITY
function generateResults() {
    const studentId = document.getElementById('results-student-select').value;
    if (!studentId) return;

    const student = students.find(s => s.id === studentId);
    const container = document.getElementById('student-report-card');

    if (student && container) {
        const studentMarks = marks.filter(m => m.studentId === studentId);

        // Calculate overall GPA and grades
        let totalPoints = 0;
        let totalCredits = 0;
        let coursesData = [];

        studentMarks.forEach(m => {
            const course = courses.find(c => c.id === m.courseId);
            if (course) {
                const gradePoints = { 'A': 4, 'B': 3, 'C': 2, 'D': 1, 'F': 0 };
                const points = gradePoints[m.grade] || 0;
                totalPoints += points * course.credits;
                totalCredits += course.credits;

                coursesData.push({
                    code: course.code,
                    name: course.name,
                    credits: course.credits,
                    cat1: m.cat1,
                    cat2: m.cat2,
                    exam: m.exam,
                    total: m.total,
                    grade: m.grade,
                    points: points
                });
            }
        });

        const overallGPA = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : '0.00';

        // Calculate overall grade classification
        let overallGrade = '';
        let classification = '';
        const gpaValue = parseFloat(overallGPA);

        if (gpaValue >= 3.6) {
            overallGrade = 'A';
            classification = 'First Class Honours';
        } else if (gpaValue >= 3.0) {
            overallGrade = 'B+';
            classification = 'Second Class Upper';
        } else if (gpaValue >= 2.5) {
            overallGrade = 'B';
            classification = 'Second Class Lower';
        } else if (gpaValue >= 2.0) {
            overallGrade = 'C';
            classification = 'Pass';
        } else {
            overallGrade = 'D';
            classification = 'Fail';
        }

        // Create transcript HTML
        const html = `
            <div class="transcript-container" id="transcript-content">
                <!-- University Header -->
                <div class="transcript-header">
                    <div class="university-info">
                        <h1 class="university-name">GARISSA UNIVERSITY</h1>
                        <div class="university-meta">
                            <p>P.O. Box 1801 - 70100, Garissa, Kenya</p>
                            <p>Tel: +254-123-456789 | Email: info@garissauniversity.ac.ke</p>
                            <p>Website: www.garissauniversity.ac.ke</p>
                        </div>
                    </div>
                    <div class="transcript-title">
                        <h2>OFFICIAL ACADEMIC TRANSCRIPT</h2>
                        <div class="seal-container">
                            <div class="seal">SEAL</div>
                        </div>
                    </div>
                </div>
                
                <!-- Student Information -->
                <div class="student-info-section">
                    <table class="info-table">
                        <tr>
                            <th width="30%">STUDENT NAME:</th>
                            <td width="70%"><strong>${student.fullName}</strong></td>
                        </tr>
                        <tr>
                            <th>REGISTRATION NUMBER:</th>
                            <td><strong>${student.regNumber}</strong></td>
                        </tr>
                        <tr>
                            <th>PROGRAM:</th>
                            <td>${student.program}</td>
                        </tr>
                        <tr>
                            <th>ADMISSION YEAR:</th>
                            <td>${student.admissionYear}</td>
                        </tr>
                        <tr>
                            <th>ACADEMIC YEAR:</th>
                            <td>Year ${student.year}, Semester ${student.semester}</td>
                        </tr>
                        <tr>
                            <th>DATE OF ISSUE:</th>
                            <td>${new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })}</td>
                        </tr>
                    </table>
                </div>
                
                <!-- Academic Performance -->
                <div class="performance-summary">
                    <div class="summary-card">
                        <h4>Overall GPA</h4>
                        <div class="gpa-value">${overallGPA}</div>
                    </div>
                    <div class="summary-card">
                        <h4>Overall Grade</h4>
                        <div class="grade-value">${overallGrade}</div>
                    </div>
                    <div class="summary-card">
                        <h4>Classification</h4>
                        <div class="classification">${classification}</div>
                    </div>
                    <div class="summary-card">
                        <h4>Total Credits</h4>
                        <div class="credits-value">${totalCredits}</div>
                    </div>
                </div>
                
                <!-- Courses Table -->
                <div class="courses-section">
                    <h3 class="section-title">ACADEMIC PERFORMANCE</h3>
                    <table class="transcript-table">
                        <thead>
                            <tr>
                                <th>Course Code</th>
                                <th>Course Title</th>
                                <th>Credits</th>
                                <th>CAT 1</th>
                                <th>CAT 2</th>
                                <th>Exam</th>
                                <th>Total</th>
                                <th>Grade</th>
                                <th>Points</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${coursesData.map(course => `
                                <tr>
                                    <td><strong>${course.code}</strong></td>
                                    <td>${course.name}</td>
                                    <td>${course.credits}</td>
                                    <td>${course.cat1}</td>
                                    <td>${course.cat2}</td>
                                    <td>${course.exam}</td>
                                    <td><strong>${course.total}</strong></td>
                                    <td><span class="grade-badge grade-${course.grade}">${course.grade}</span></td>
                                    <td>${course.points}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                
                <!-- Grading System -->
                <div class="grading-system">
                    <h3 class="section-title">GRADING SYSTEM</h3>
                    <table class="grading-table">
                        <thead>
                            <tr>
                                <th>Marks Range</th>
                                <th>Grade</th>
                                <th>Points</th>
                                <th>Classification</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>70 - 100</td>
                                <td>A</td>
                                <td>4.0</td>
                                <td>Excellent</td>
                            </tr>
                            <tr>
                                <td>60 - 69</td>
                                <td>B</td>
                                <td>3.0</td>
                                <td>Good</td>
                            </tr>
                            <tr>
                                <td>50 - 59</td>
                                <td>C</td>
                                <td>2.0</td>
                                <td>Average</td>
                            </tr>
                            <tr>
                                <td>40 - 49</td>
                                <td>D</td>
                                <td>1.0</td>
                                <td>Pass</td>
                            </tr>
                            <tr>
                                <td>0 - 39</td>
                                <td>F</td>
                                <td>0.0</td>
                                <td>Fail</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                
                <!-- Footer -->
                <div class="transcript-footer">
                    <div class="signature-section">
                        <div class="signature-box">
                            <div class="signature-line"></div>
                            <p>Registrar / Academic Dean</p>
                        </div>
                        <div class="official-stamp">
                            <div class="stamp">OFFICIAL</div>
                            <p>Garissa University</p>
                        </div>
                    </div>
                    <div class="footer-note">
                        <p><strong>Note:</strong> This is an official transcript. Any alteration renders it invalid.</p>
                        <p>Verification can be done at: transcripts@garissauniversity.ac.ke</p>
                    </div>
                </div>
            </div>
            
            <!-- Print/Download Buttons -->
            <div class="transcript-actions" style="margin-top: 2rem; text-align: center;">
                <button class="btn btn-primary" onclick="printTranscript()">
                    <i class="fas fa-print"></i> Print Transcript
                </button>
                <button class="btn btn-success" onclick="downloadTranscript()">
                    <i class="fas fa-download"></i> Download as PDF
                </button>
            </div>
        `;

        container.innerHTML = html;
        container.classList.remove('hidden');
        container.style.display = 'block';
    }
}

// SIMPLE PRINT FUNCTION THAT WORKS
function printTranscript() {
    const transcriptContent = document.getElementById('transcript-content');
    if (!transcriptContent) {
        showNotification('No transcript content found', 'danger');
        return;
    }

    // Create a simple print window
    const printWindow = window.open('', '_blank');

    // Get basic transcript HTML
    const transcriptHTML = transcriptContent.innerHTML;

    // Create a clean print document
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Academic Transcript - Garissa University</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 20px;
                    color: #333;
                }
                .transcript-container {
                    max-width: 1000px;
                    margin: 0 auto;
                    background: white;
                }
                .transcript-header {
                    text-align: center;
                    border-bottom: 3px solid #4e73df;
                    padding-bottom: 20px;
                    margin-bottom: 30px;
                }
                .university-name {
                    color: #2e59d9;
                    font-size: 24px;
                    margin: 10px 0;
                    text-transform: uppercase;
                }
                .university-meta {
                    color: #666;
                    font-size: 14px;
                    margin: 10px 0;
                }
                .transcript-title h2 {
                    color: #333;
                    font-size: 18px;
                    margin: 20px 0;
                }
                .student-info-section {
                    background: #f8f9fc;
                    padding: 20px;
                    margin-bottom: 20px;
                    border-left: 4px solid #4e73df;
                }
                .info-table {
                    width: 100%;
                    border-collapse: collapse;
                }
                .info-table th {
                    text-align: left;
                    padding: 8px 0;
                    color: #666;
                    font-weight: 600;
                    font-size: 14px;
                }
                .info-table td {
                    padding: 8px 0;
                    font-size: 16px;
                }
                .performance-summary {
                    display: flex;
                    justify-content: space-between;
                    margin: 30px 0;
                }
                .summary-card {
                    background: #4e73df;
                    color: white;
                    padding: 15px;
                    border-radius: 8px;
                    text-align: center;
                    flex: 1;
                    margin: 0 10px;
                }
                .summary-card h4 {
                    margin: 0 0 10px 0;
                    font-size: 14px;
                }
                .gpa-value, .grade-value, .classification, .credits-value {
                    font-size: 20px;
                    font-weight: bold;
                }
                .section-title {
                    color: #2e59d9;
                    border-bottom: 2px solid #e3e6f0;
                    padding-bottom: 10px;
                    margin: 30px 0 15px 0;
                }
                .transcript-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 20px 0;
                }
                .transcript-table th {
                    background: #4e73df;
                    color: white;
                    padding: 12px;
                    text-align: left;
                    font-weight: 600;
                }
                .transcript-table td {
                    padding: 10px;
                    border-bottom: 1px solid #e3e6f0;
                }
                .grade-badge {
                    display: inline-block;
                    padding: 4px 12px;
                    border-radius: 20px;
                    font-weight: bold;
                    font-size: 12px;
                    color: white;
                }
                .grade-A { background: #1cc88a; }
                .grade-B { background: #36b9cc; }
                .grade-C { background: #f6c23e; }
                .grade-D { background: #e74a3b; }
                .grade-F { background: #858796; }
                .grading-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 20px 0;
                }
                .grading-table th, .grading-table td {
                    padding: 10px;
                    border: 1px solid #e3e6f0;
                }
                .grading-table th {
                    background: #f8f9fc;
                }
                .transcript-footer {
                    margin-top: 40px;
                    padding-top: 20px;
                    border-top: 2px solid #e3e6f0;
                }
                .signature-section {
                    display: flex;
                    justify-content: space-between;
                    margin: 30px 0;
                }
                .signature-box, .official-stamp {
                    text-align: center;
                }
                .signature-line {
                    width: 200px;
                    height: 1px;
                    background: #333;
                    margin: 0 auto 10px;
                }
                .stamp {
                    width: 100px;
                    height: 100px;
                    border: 3px solid #e74a3b;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 10px;
                    color: #e74a3b;
                    font-weight: bold;
                    transform: rotate(-15deg);
                }
                .footer-note {
                    text-align: center;
                    color: #666;
                    font-size: 12px;
                    padding-top: 20px;
                    border-top: 1px dashed #e3e6f0;
                }
                @media print {
                    body {
                        padding: 0;
                    }
                    .transcript-container {
                        box-shadow: none;
                    }
                }
            </style>
        </head>
        <body>
            ${transcriptHTML}
            <script>
                // Auto-print when page loads
                window.onload = function() {
                    window.print();
                };
            </script>
        </body>
        </html>
    `);

    printWindow.document.close();
    showNotification('Opening print dialog...', 'info');
}

// Download transcript function
function downloadTranscript() {
    printTranscript();
    showNotification('Use print dialog to save as PDF', 'info');
}

function setupEventListeners() {
    document.getElementById('add-student-form')?.addEventListener('submit', addStudent);
    document.getElementById('edit-student-form')?.addEventListener('submit', updateStudent);
    document.getElementById('add-course-form')?.addEventListener('submit', addCourse);
    document.getElementById('edit-course-form')?.addEventListener('submit', updateCourse);
    document.getElementById('add-marks-form')?.addEventListener('submit', addMarks);
    document.getElementById('add-marks-form')?.addEventListener('input', handleMarksInput);
    document.getElementById('refresh-btn')?.addEventListener('click', refreshData);
    document.getElementById('generate-results-btn')?.addEventListener('click', generateResults);

    // Dropdown toggle
    document.getElementById('userDropdown')?.addEventListener('click', function (e) {
        e.stopPropagation();
        document.getElementById('userDropdownMenu')?.classList.toggle('show');
    });

    // Close dropdown when clicking outside
    window.addEventListener('click', function () {
        document.getElementById('userDropdownMenu')?.classList.remove('show');
    });

    // Remove the old print event listeners and add new ones
    const printTranscriptBtn = document.getElementById('print-transcript');
    if (printTranscriptBtn) {
        printTranscriptBtn.removeEventListener('click', window.print);
        printTranscriptBtn.addEventListener('click', printTranscript);
    }

    const downloadResultsBtn = document.getElementById('download-results');
    if (downloadResultsBtn) {
        downloadResultsBtn.removeEventListener('click', window.print);
        downloadResultsBtn.addEventListener('click', downloadTranscript);
    }

    // Search
    document.getElementById('search-student')?.addEventListener('input', (e) => renderStudentsTable(e.target.value));
    document.getElementById('search-course')?.addEventListener('input', (e) => renderCoursesTable(e.target.value));

    // Program Filters
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            renderStudentsTable('', this.dataset.program);
        });
    });

    // Semester Filters
    document.querySelectorAll('.sem-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.sem-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            renderCoursesTable('', this.dataset.semester);
        });
    });

    // Data Management
    document.getElementById('load-sample-btn')?.addEventListener('click', () => { fetchAllData(); showNotification('Data Reloaded'); });
    document.getElementById('clear-data-btn')?.addEventListener('click', () => { alert('Clear data requires backend intervention or manual db.json reset.'); });
}

// Helpers
function showNotification(msg, type = 'info') {
    const n = document.createElement('div');
    n.className = `notification notification-${type}`;
    n.innerHTML = `<i class="fas fa-info-circle"></i> <span>${msg}</span>`;
    document.body.appendChild(n);
    setTimeout(() => n.remove(), 3000);
}

function populateStudentSelect(id) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = '<option value="">Select Student</option>' + students.map(s => `<option value="${s.id}">${s.regNumber} - ${s.fullName}</option>`).join('');
}

function populateCourseSelect(id) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = courses.map(c => `<option value="${c.id}">${c.code} - ${c.name}</option>`).join('');
}

function openModal(id) {
    document.getElementById(id).style.display = 'block';
    if (id === 'add-marks-modal') {
        populateStudentSelect('marks-student-select');
        const cSel = document.getElementById('marks-course-select');
        if (cSel) cSel.innerHTML = '<option value="">Select Course</option>' + courses.map(c => `<option value="${c.id}">${c.code} - ${c.name}</option>`).join('');
    }
}

function closeModal(id) { document.getElementById(id).style.display = 'none'; }

function editStudent(id) {
    const s = students.find(s => s.id === id);
    if (s) {
        document.getElementById('edit-student-id').value = s.id;
        document.getElementById('edit-regNumber').value = s.regNumber;
        document.getElementById('edit-fullName').value = s.fullName;
        document.getElementById('edit-email').value = s.email;
        document.getElementById('edit-status').value = s.status;
        openModal('edit-student-modal');
    }
}

function viewStudentDetails(id) {
    switchTab('results');
    setTimeout(() => {
        const sel = document.getElementById('results-student-select');
        if (sel) { sel.value = id; generateResults(); }
    }, 500);
}

// Add transcript CSS dynamically
function addTranscriptCSS() {
    const transcriptCSS = `
    <style>
        .transcript-container {
            background: white;
            padding: 2rem;
            border-radius: 8px;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
            max-width: 1000px;
            margin: 0 auto;
        }
        
        .transcript-header {
            text-align: center;
            border-bottom: 3px solid #4e73df;
            padding-bottom: 1rem;
            margin-bottom: 2rem;
        }
        
        .university-name {
            color: #2e59d9;
            font-size: 2rem;
            margin-bottom: 0.5rem;
            text-transform: uppercase;
        }
        
        .university-meta {
            color: #666;
            font-size: 0.9rem;
            margin-bottom: 1rem;
        }
        
        .transcript-title {
            position: relative;
            margin-top: 1rem;
        }
        
        .transcript-title h2 {
            color: #333;
            font-size: 1.5rem;
            margin: 0;
        }
        
        .seal-container {
            position: absolute;
            right: 0;
            top: 0;
        }
        
        .seal {
            width: 80px;
            height: 80px;
            border: 2px dashed #2e59d9;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #2e59d9;
            font-weight: bold;
            font-size: 0.8rem;
        }
        
        .student-info-section {
            background: #f8f9fc;
            padding: 1.5rem;
            border-radius: 8px;
            margin-bottom: 2rem;
            border-left: 4px solid #4e73df;
        }
        
        .info-table {
            width: 100%;
            border-collapse: collapse;
        }
        
        .info-table th {
            text-align: left;
            padding: 8px 0;
            color: #666;
            font-weight: 600;
            font-size: 0.9rem;
        }
        
        .info-table td {
            padding: 8px 0;
            font-size: 1rem;
        }
        
        .performance-summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            margin-bottom: 2rem;
        }
        
        .summary-card {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 1rem;
            border-radius: 8px;
            text-align: center;
        }
        
        .summary-card h4 {
            margin: 0 0 0.5rem 0;
            font-size: 0.9rem;
            opacity: 0.9;
        }
        
        .gpa-value {
            font-size: 2rem;
            font-weight: bold;
        }
        
        .grade-value {
            font-size: 2rem;
            font-weight: bold;
        }
        
        .classification {
            font-size: 1.2rem;
            font-weight: bold;
        }
        
        .credits-value {
            font-size: 2rem;
            font-weight: bold;
        }
        
        .section-title {
            color: #2e59d9;
            border-bottom: 2px solid #e3e6f0;
            padding-bottom: 0.5rem;
            margin: 2rem 0 1rem 0;
            font-size: 1.2rem;
        }
        
        .transcript-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 2rem;
        }
        
        .transcript-table th {
            background: #4e73df;
            color: white;
            padding: 12px;
            text-align: left;
            font-weight: 600;
        }
        
        .transcript-table td {
            padding: 10px;
            border-bottom: 1px solid #e3e6f0;
        }
        
        .transcript-table tr:hover {
            background: #f8f9fc;
        }
        
        .grade-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-weight: bold;
            font-size: 0.8rem;
            text-align: center;
            min-width: 30px;
            color: white;
        }
        
        .grade-A { background: #1cc88a; }
        .grade-B { background: #36b9cc; }
        .grade-C { background: #f6c23e; }
        .grade-D { background: #e74a3b; }
        .grade-F { background: #858796; }
        
        .grading-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 2rem;
        }
        
        .grading-table th {
            background: #f8f9fc;
            padding: 10px;
            text-align: left;
            border: 1px solid #e3e6f0;
        }
        
        .grading-table td {
            padding: 10px;
            border: 1px solid #e3e6f0;
        }
        
        .transcript-footer {
            margin-top: 3rem;
            padding-top: 2rem;
            border-top: 2px solid #e3e6f0;
        }
        
        .signature-section {
            display: flex;
            justify-content: space-between;
            margin-bottom: 2rem;
        }
        
        .signature-box {
            text-align: center;
        }
        
        .signature-line {
            width: 200px;
            height: 1px;
            background: #333;
            margin: 0 auto 5px;
        }
        
        .official-stamp {
            text-align: center;
        }
        
        .stamp {
            width: 100px;
            height: 100px;
            border: 3px solid #e74a3b;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 5px;
            color: #e74a3b;
            font-weight: bold;
            transform: rotate(-15deg);
        }
        
        .footer-note {
            text-align: center;
            color: #666;
            font-size: 0.9rem;
            padding-top: 1rem;
            border-top: 1px dashed #e3e6f0;
        }
    </style>
    `;

    if (!document.getElementById('transcript-styles')) {
        const styleElement = document.createElement('style');
        styleElement.id = 'transcript-styles';
        styleElement.innerHTML = transcriptCSS;
        document.head.appendChild(styleElement);
    }
}

// Call this function when the app initializes
document.addEventListener('DOMContentLoaded', () => {
    addTranscriptCSS();
});

// Global scope
window.openModal = openModal;
window.closeModal = closeModal;
window.switchTab = switchTab;
window.editStudent = editStudent;
window.editCourse = editCourse;
window.deleteStudent = deleteStudent;
window.deleteCourse = deleteCourse;
window.deleteMark = deleteMark;
window.viewStudentDetails = viewStudentDetails;
window.generateResults = generateResults;
window.printTranscript = printTranscript;
window.downloadTranscript = downloadTranscript;
window.logout = logout;
window.refreshData = refreshData;

function logout() {
    localStorage.removeItem('userSession');
    window.location.href = 'login.html';
}

async function refreshData() {
    await fetchAllData();
    showNotification('Data refreshed successfully', 'success');
}
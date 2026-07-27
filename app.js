
// API: http://localhost:3000
// ============================================================

console.log("====================================");
console.log("CORRECT APP.JS IS RUNNING");
console.log("API URL: http://localhost:3000");
console.log("====================================");

// ============================================================
// CONFIGURATION
// ============================================================

const API_URL = 'http://localhost:3000';

// ============================================================
// GLOBAL STATE
// ============================================================

let students = [];
let courses = [];
let marks = [];
let programs = [];
let semesters = [];

let currentTab = 'dashboard';

// ============================================================
// AUTHENTICATION
// ============================================================

function checkAuth() {
    const session = localStorage.getItem('userSession');

    if (!session) {
        window.location.href = 'login.html';
        return false;
    }

    try {
        const user = JSON.parse(session);

        const userDisplay = document.getElementById('user-name-display');

        if (userDisplay) {
            userDisplay.textContent = user.name || 'User';
        }

        return true;

    } catch (error) {
        console.error('Invalid session:', error);
        localStorage.removeItem('userSession');
        window.location.href = 'login.html';
        return false;
    }
}

// ============================================================
// INITIALIZE APPLICATION
// ============================================================

document.addEventListener('DOMContentLoaded', async () => {

    addTranscriptCSS();

    if (!checkAuth()) {
        return;
    }

    setupEventListeners();

    await initializeApp();
});

async function initializeApp() {

    try {

        await fetchAllData();

        // Start on dashboard
        switchTab('dashboard');

    } catch (error) {

        console.error('Application initialization error:', error);

        showNotification(
            'Failed to initialize application.',
            'danger'
        );

    }
}

// ============================================================
// DATA FETCHING
// ============================================================

async function fetchData(endpoint) {

    try {

        const response = await fetch(`${API_URL}/${endpoint}`);

        if (!response.ok) {
            throw new Error(
                `HTTP error! Status: ${response.status}`
            );
        }

        return await response.json();

    } catch (error) {

        console.error(
            `Error fetching ${endpoint}:`,
            error
        );

        showNotification(
            `Failed to load ${endpoint}. Make sure JSON Server is running.`,
            'danger'
        );

        return [];
    }
}

// ============================================================
// POST DATA
// ============================================================

async function postData(endpoint, data) {

    try {

        console.log(`POST ${endpoint}:`, data);

        const response = await fetch(
            `${API_URL}/${endpoint}`,
            {
                method: 'POST',

                headers: {
                    'Content-Type': 'application/json'
                },

                body: JSON.stringify(data)
            }
        );

        if (!response.ok) {
            throw new Error(
                `HTTP error! Status: ${response.status}`
            );
        }

        const result = await response.json();

        console.log(
            `JSON SERVER RESPONSE ${endpoint}:`,
            result
        );

        return result;

    } catch (error) {

        console.error(
            `Error posting to ${endpoint}:`,
            error
        );

        showNotification(
            'Failed to save data.',
            'danger'
        );

        return null;
    }
}

// ============================================================
// UPDATE DATA
// ============================================================

async function updateData(endpoint, id, data) {

    try {

        const response = await fetch(
            `${API_URL}/${endpoint}/${encodeURIComponent(id)}`,
            {
                method: 'PUT',

                headers: {
                    'Content-Type': 'application/json'
                },

                body: JSON.stringify(data)
            }
        );

        if (!response.ok) {
            throw new Error(
                `HTTP error! Status: ${response.status}`
            );
        }

        return await response.json();

    } catch (error) {

        console.error(
            `Error updating ${endpoint}/${id}:`,
            error
        );

        showNotification(
            'Failed to update data.',
            'danger'
        );

        return null;
    }
}

// ============================================================
// DELETE DATA
// ============================================================

async function deleteData(endpoint, id) {

    try {

        const response = await fetch(
            `${API_URL}/${endpoint}/${encodeURIComponent(id)}`,
            {
                method: 'DELETE'
            }
        );

        if (!response.ok) {
            throw new Error(
                `HTTP error! Status: ${response.status}`
            );
        }

        return true;

    } catch (error) {

        console.error(
            `Error deleting ${endpoint}/${id}:`,
            error
        );

        showNotification(
            'Failed to delete data.',
            'danger'
        );

        return false;
    }
}

// ============================================================
// FETCH ALL DATA - MODIFIED to NOT update UI
// ============================================================

async function fetchAllData(skipRender = false) {

    try {

        const [
            studentsData,
            coursesData,
            marksData,
            programsData,
            semestersData
        ] = await Promise.all([

            fetchData('students'),
            fetchData('courses'),
            fetchData('marks'),
            fetchData('programs'),
            fetchData('semesters')

        ]);

        students = studentsData;
        courses = coursesData;
        marks = marksData;
        programs = programsData;
        semesters = semestersData;

        // Only update dashboard if not skipping render
        if (!skipRender) {
            updateDashboard();
        }

        console.log('All data refreshed successfully.');

        return true;

    } catch (error) {

        console.error(
            'Error fetching all data:',
            error
        );

        return false;
    }
}

// ============================================================
// TAB SWITCHING
// ============================================================

function switchTab(tabId) {

    currentTab = tabId;

    // Update tab buttons

    document.querySelectorAll('.tab-btn').forEach(btn => {

        btn.classList.remove('active');

        if (
            btn.getAttribute('data-tab') === tabId
        ) {
            btn.classList.add('active');
        }

    });

    // Hide all tab content

    document.querySelectorAll('.tab-content').forEach(content => {

        content.classList.remove('active');

    });

    // Show selected tab

    const selectedTab = document.getElementById(tabId);

    if (selectedTab) {

        selectedTab.classList.add('active');

    }

    // Load tab content

    switch (tabId) {

        case 'dashboard':

            updateDashboard();

            break;

        case 'students':

            renderStudentsTable();

            break;

        case 'courses':

            renderCoursesTable();

            break;

        case 'enter-marks':

            renderMarksTable();

            break;

        case 'results':

            populateStudentSelect(
                'results-student-select'
            );

            break;

        case 'analytics':

            renderAnalytics();

            break;

    }
}

// ============================================================
// DASHBOARD
// ============================================================

function updateDashboard() {

    const totalStudents =
        document.getElementById('total-students');

    const totalCourses =
        document.getElementById('total-courses');

    const passRate =
        document.getElementById('pass-rate');

    const avgGPA =
        document.getElementById('avg-gpa');

    if (totalStudents) {
        totalStudents.textContent =
            students.length;
    }

    if (totalCourses) {
        totalCourses.textContent =
            courses.length;
    }

    if (marks.length > 0) {

        const passedMarks =
            marks.filter(
                mark =>
                    mark.total >= 40
            ).length;

        const calculatedPassRate =
            (
                passedMarks /
                marks.length *
                100
            ).toFixed(1);

        if (passRate) {

            passRate.textContent =
                `${calculatedPassRate}%`;

        }

        let totalGPA = 0;
        let studentCount = 0;

        students.forEach(student => {

            const studentMarks =
                marks.filter(
                    mark =>
                        String(mark.studentId) ===
                        String(student.id)
                );

            if (studentMarks.length === 0) {
                return;
            }

            let totalPoints = 0;
            let totalCredits = 0;

            studentMarks.forEach(record => {

                const course =
                    courses.find(
                        c =>
                            String(c.id) ===
                            String(record.courseId)
                    );

                if (!course) {
                    return;
                }

                const points = {
                    A: 4,
                    B: 3,
                    C: 2,
                    D: 1,
                    F: 0
                }[record.grade] || 0;

                const credits =
                    Number(course.credits) || 0;

                totalPoints +=
                    points * credits;

                totalCredits +=
                    credits;

            });

            if (totalCredits > 0) {

                totalGPA +=
                    totalPoints /
                    totalCredits;

                studentCount++;

            }

        });

        const calculatedGPA =
            studentCount > 0
                ? (
                    totalGPA /
                    studentCount
                ).toFixed(2)
                : '0.00';

        if (avgGPA) {

            avgGPA.textContent =
                calculatedGPA;

        }

    } else {

        if (passRate) {
            passRate.textContent = '0%';
        }

        if (avgGPA) {
            avgGPA.textContent = '0.00';
        }

    }

    updateMiniCharts();

    const lastUpdated =
        document.getElementById(
            'last-updated'
        );

    if (lastUpdated) {

        lastUpdated.textContent =
            new Date().toLocaleTimeString(
                [],
                {
                    hour: '2-digit',
                    minute: '2-digit'
                }
            );

    }
}

// ============================================================
// MINI CHARTS
// ============================================================

function updateMiniCharts() {

    const gradeCtx =
        document
            .getElementById(
                'gradeDistributionChart'
            )
            ?.getContext('2d');

    if (gradeCtx) {

        if (window.gradeChart) {

            window.gradeChart.destroy();

        }

        const gradeCounts = {
            A: 0,
            B: 0,
            C: 0,
            D: 0,
            F: 0
        };

        marks.forEach(mark => {

            if (
                Object.prototype.hasOwnProperty.call(
                    gradeCounts,
                    mark.grade
                )
            ) {

                gradeCounts[mark.grade]++;

            }

        });

        window.gradeChart =
            new Chart(
                gradeCtx,
                {
                    type: 'doughnut',

                    data: {

                        labels: [
                            'A',
                            'B',
                            'C',
                            'D',
                            'F'
                        ],

                        datasets: [{

                            data:
                                Object.values(
                                    gradeCounts
                                ),

                            backgroundColor: [
                                '#1cc88a',
                                '#36b9cc',
                                '#f6c23e',
                                '#e74a3b',
                                '#858796'
                            ],

                            borderWidth: 1

                        }]

                    },

                    options: {

                        responsive: true,

                        maintainAspectRatio:
                            false,

                        cutout: '70%'

                    }
                }
            );

    }

    const trendCtx =
        document
            .getElementById(
                'performanceTrendChart'
            )
            ?.getContext('2d');

    if (trendCtx) {

        if (window.trendChart) {

            window.trendChart.destroy();

        }

        window.trendChart =
            new Chart(
                trendCtx,
                {
                    type: 'line',

                    data: {

                        labels: [
                            'Jan',
                            'Feb',
                            'Mar',
                            'Apr',
                            'May',
                            'Jun'
                        ],

                        datasets: [{

                            label:
                                'Avg Score',

                            data: [
                                65,
                                68,
                                72,
                                75,
                                78,
                                80
                            ],

                            borderColor:
                                '#4e73df',

                            backgroundColor:
                                'rgba(78, 115, 223, 0.1)',

                            tension: 0.4,

                            fill: true

                        }]

                    },

                    options: {

                        responsive: true,

                        maintainAspectRatio:
                            false,

                        scales: {

                            y: {

                                beginAtZero:
                                    true,

                                max: 100

                            }

                        }

                    }
                }
            );

    }
}

// ============================================================
// STUDENT TABLE
// ============================================================

function renderStudentsTable(
    searchTerm = '',
    programFilter = 'all'
) {

    const tbody =
        document.querySelector(
            '#students-table tbody'
        );

    if (!tbody) {
        console.log('Students table tbody not found');
        return;
    }

    tbody.innerHTML = '';

    let filtered =
        [...students];

    if (searchTerm) {

        filtered =
            filtered.filter(student =>

                String(
                    student.fullName || ''
                )
                    .toLowerCase()
                    .includes(
                        searchTerm
                            .toLowerCase()
                    )

            );

    }

    if (
        programFilter &&
        programFilter !== 'all'
    ) {

        filtered =
            filtered.filter(
                student =>
                    student.program ===
                    programFilter
            );

    }

    filtered.forEach(student => {

        const row =
            document.createElement('tr');

        row.innerHTML = `

            <td>${student.id}</td>

            <td class="font-weight-bold">
                ${student.regNumber || ''}
            </td>

            <td>
                ${student.fullName || ''}
            </td>

            <td>
                ${student.email || ''}
            </td>

            <td>
                <span class="badge badge-program">
                    ${student.program || ''}
                </span>
            </td>

            <td>
                Y${student.year || ''}
                S${student.semester || ''}
            </td>

            <td>
                <span class="status status-${String(
                    student.status ||
                    'Active'
                ).toLowerCase()}">
                    ${student.status || 'Active'}
                </span>
            </td>

            <td>

                <button
                    class="icon-btn edit-btn"
                    onclick="editStudent('${student.id}')"
                >
                    <i class="fas fa-edit"></i>
                </button>

                <button
                    class="icon-btn delete-btn"
                    onclick="deleteStudent('${student.id}')"
                >
                    <i class="fas fa-trash"></i>
                </button>

                <button
                    class="icon-btn view-btn"
                    onclick="viewStudentDetails('${student.id}')"
                >
                    <i class="fas fa-eye"></i>
                </button>

            </td>

        `;

        tbody.appendChild(row);

    });

    const studentCount =
        document.getElementById(
            'student-count'
        );

    if (studentCount) {

        studentCount.textContent =
            filtered.length;

    }
}

// ============================================================
// GENERATE NUMERIC STUDENT ID
// ============================================================

function generateNextStudentId() {

    const numericIds =
        students

            .map(student =>
                Number(student.id)
            )

            .filter(id =>
                Number.isInteger(id) &&
                id > 0
            );

    if (numericIds.length === 0) {

        return '1';

    }

    const highestId =
        Math.max(...numericIds);

    return String(
        highestId + 1
    );
}

// ============================================================
// ADD STUDENT - COMPLETELY REWRITTEN
// ============================================================

async function addStudent(e) {

    e.preventDefault();

    const form =
        e.target;

    const formData =
        new FormData(form);

    // Generate numeric ID
    const nextId =
        generateNextStudentId();

    console.log(
        'NEXT NUMERIC ID:',
        nextId
    );

    const student = {

        id: nextId,

        regNumber:
            formData.get(
                'regNumber'
            ),

        fullName:
            formData.get(
                'fullName'
            ),

        email:
            formData.get(
                'email'
            ),

        phone:
            formData.get(
                'phone'
            ) || '',

        program:
            formData.get(
                'program'
            ),

        admissionYear:
            formData.get(
                'admissionYear'
            ) || '',

        year:
            formData.get(
                'year'
            ),

        semester:
            formData.get(
                'semester'
            ),

        status:
            'Active',

        joinDate:
            new Date()
                .toISOString()
                .split('T')[0]

    };

    console.log(
        'STUDENT BEING SENT:',
        student
    );

    const result =
        await postData(
            'students',
            student
        );

    if (!result) {
        return;
    }

    console.log(
        'STUDENT SENT ID:',
        student.id
    );

    console.log(
        'JSON SERVER RETURNED:',
        result
    );

    // Close modal
    closeModal(
        'add-student-modal'
    );

    // Reset form
    form.reset();

    // Fetch fresh data - skip UI update
    await fetchAllData(true);
    
    // Manually update dashboard
    updateDashboard();
    
    // Force re-render the students table
    renderStudentsTable();
    
    // Make sure we stay on students tab
    // But don't trigger a full tab switch
    const studentsTab = document.getElementById('students');
    const allTabs = document.querySelectorAll('.tab-content');
    const allButtons = document.querySelectorAll('.tab-btn');
    
    // Update tab buttons
    allButtons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-tab') === 'students') {
            btn.classList.add('active');
        }
    });
    
    // Update tab content
    allTabs.forEach(content => {
        content.classList.remove('active');
    });
    
    if (studentsTab) {
        studentsTab.classList.add('active');
    }
    
    currentTab = 'students';

    showNotification(
        `Student added successfully with ID ${student.id}`,
        'success'
    );
}

// ============================================================
// EDIT STUDENT
// ============================================================

function editStudent(id) {

    const student =
        students.find(
            s =>
                String(s.id) ===
                String(id)
        );

    if (!student) {
        return;
    }

    document.getElementById(
        'edit-student-id'
    ).value =
        student.id;

    document.getElementById(
        'edit-regNumber'
    ).value =
        student.regNumber || '';

    document.getElementById(
        'edit-fullName'
    ).value =
        student.fullName || '';

    document.getElementById(
        'edit-email'
    ).value =
        student.email || '';

    document.getElementById(
        'edit-status'
    ).value =
        student.status || 'Active';

    const phone =
        document.getElementById(
            'edit-phone'
        );

    if (phone) {
        phone.value =
            student.phone || '';
    }

    const program =
        document.getElementById(
            'edit-program'
        );

    if (program) {
        program.value =
            student.program || '';
    }

    const year =
        document.getElementById(
            'edit-year'
        );

    if (year) {
        year.value =
            student.year || '';
    }

    const semester =
        document.getElementById(
            'edit-semester'
        );

    if (semester) {
        semester.value =
            student.semester || '';
    }

    openModal(
        'edit-student-modal'
    );
}

// ============================================================
// UPDATE STUDENT
// ============================================================

async function updateStudent(e) {

    e.preventDefault();

    const form =
        e.target;

    const id =
        document.getElementById(
            'edit-student-id'
        ).value;

    const data = {

        regNumber:
            document.getElementById(
                'edit-regNumber'
            ).value,

        fullName:
            document.getElementById(
                'edit-fullName'
            ).value,

        email:
            document.getElementById(
                'edit-email'
            ).value,

        phone:
            document.getElementById(
                'edit-phone'
            )?.value || '',

        program:
            document.getElementById(
                'edit-program'
            )?.value || '',

        status:
            document.getElementById(
                'edit-status'
            ).value,

        year:
            document.getElementById(
                'edit-year'
            )?.value || '',

        semester:
            document.getElementById(
                'edit-semester'
            )?.value || ''

    };

    const result =
        await updateData(
            'students',
            id,
            data
        );

    if (!result) {
        return;
    }

    // Close modal
    closeModal(
        'edit-student-modal'
    );

    // Fetch fresh data - skip UI update
    await fetchAllData(true);
    
    // Manually update dashboard
    updateDashboard();
    
    // Force re-render the students table
    renderStudentsTable();

    showNotification(
        'Student updated successfully.',
        'success'
    );
}

// ============================================================
// DELETE STUDENT - COMPLETELY REWRITTEN
// ============================================================

async function deleteStudent(id) {

    const confirmed =
        confirm(
            'Are you sure you want to delete this student?'
        );

    if (!confirmed) {
        return;
    }

    console.log(
        'Deleting student ID:',
        id
    );

    const success =
        await deleteData(
            'students',
            id
        );

    if (!success) {
        return;
    }

    // Fetch fresh data - skip UI update
    await fetchAllData(true);
    
    // Manually update dashboard
    updateDashboard();
    
    // Force re-render the students table
    renderStudentsTable();

    showNotification(
        'Student deleted successfully.',
        'success'
    );
}

// ============================================================
// COURSES TABLE
// ============================================================

function renderCoursesTable(
    searchTerm = '',
    semesterFilter = 'all'
) {

    const tbody =
        document.querySelector(
            '#courses-table tbody'
        );

    if (!tbody) {
        return;
    }

    tbody.innerHTML = '';

    let filtered =
        [...courses];

    if (searchTerm) {

        filtered =
            filtered.filter(course =>

                String(
                    course.name || ''
                )
                    .toLowerCase()
                    .includes(
                        searchTerm.toLowerCase()
                    ) ||

                String(
                    course.code || ''
                )
                    .toLowerCase()
                    .includes(
                        searchTerm.toLowerCase()
                    )

            );

    }

    if (
        semesterFilter &&
        semesterFilter !== 'all'
    ) {

        filtered =
            filtered.filter(
                course =>
                    `${course.year}.${course.semester}` ===
                    semesterFilter
            );

    }

    filtered.forEach(course => {

        const row =
            document.createElement('tr');

        row.innerHTML = `

            <td>
                ${course.code || ''}
            </td>

            <td>
                ${course.name || ''}
            </td>

            <td>
                ${course.program || ''}
            </td>

            <td>
                ${course.year || ''}.
                ${course.semester || ''}
            </td>

            <td>
                ${course.credits || 0}
            </td>

            <td>

                <span class="status status-${String(
                    course.status ||
                    'Active'
                ).toLowerCase()}">

                    ${course.status || 'Active'}

                </span>

            </td>

            <td>

                <button
                    class="icon-btn edit-btn"
                    onclick="editCourse('${course.id}')"
                >
                    <i class="fas fa-edit"></i>
                </button>

                <button
                    class="icon-btn delete-btn"
                    onclick="deleteCourse('${course.id}')"
                >
                    <i class="fas fa-trash"></i>
                </button>

            </td>

        `;

        tbody.appendChild(row);

    });

}

// ============================================================
// ADD COURSE
// ============================================================

async function addCourse(e) {

    e.preventDefault();

    const form =
        e.target;

    const formData =
        new FormData(form);

    const course = {

        id:
            'c' +
            Date.now(),

        code:
            formData.get(
                'code'
            ),

        name:
            formData.get(
                'name'
            ),

        program:
            formData.get(
                'program'
            ),

        credits:
            parseInt(
                formData.get(
                    'credits'
                )
            ) || 0,

        year:
            formData.get(
                'year'
            ),

        semester:
            formData.get(
                'semester'
            ),

        status:
            formData.get(
                'status'
            ) || 'Active'

    };

    const result =
        await postData(
            'courses',
            course
        );

    if (!result) {
        return;
    }

    await fetchAllData();

    closeModal(
        'add-course-modal'
    );

    form.reset();

    switchTab(
        'courses'
    );

    showNotification(
        'Course added successfully.',
        'success'
    );
}

// ============================================================
// EDIT COURSE
// ============================================================

function editCourse(id) {

    const course =
        courses.find(
            c =>
                String(c.id) ===
                String(id)
        );

    if (!course) {
        return;
    }

    document.getElementById(
        'edit-course-id'
    ).value =
        course.id;

    document.getElementById(
        'edit-course-code'
    ).value =
        course.code || '';

    document.getElementById(
        'edit-course-name'
    ).value =
        course.name || '';

    document.getElementById(
        'edit-course-program'
    ).value =
        course.program || '';

    document.getElementById(
        'edit-course-credits'
    ).value =
        course.credits || 0;

    document.getElementById(
        'edit-course-year'
    ).value =
        course.year || '';

    document.getElementById(
        'edit-course-semester'
    ).value =
        course.semester || '';

    document.getElementById(
        'edit-course-status'
    ).value =
        course.status || 'Active';

    openModal(
        'edit-course-modal'
    );
}

// ============================================================
// UPDATE COURSE
// ============================================================

async function updateCourse(e) {

    e.preventDefault();

    const id =
        document.getElementById(
            'edit-course-id'
        ).value;

    const formData =
        new FormData(
            e.target
        );

    const data = {

        code:
            formData.get(
                'code'
            ),

        name:
            formData.get(
                'name'
            ),

        program:
            formData.get(
                'program'
            ),

        credits:
            parseInt(
                formData.get(
                    'credits'
                )
            ) || 0,

        year:
            formData.get(
                'year'
            ),

        semester:
            formData.get(
                'semester'
            ),

        status:
            formData.get(
                'status'
            )

    };

    const result =
        await updateData(
            'courses',
            id,
            data
        );

    if (!result) {
        return;
    }

    await fetchAllData();

    closeModal(
        'edit-course-modal'
    );

    switchTab(
        'courses'
    );

    showNotification(
        'Course updated successfully.',
        'success'
    );
}

// ============================================================
// DELETE COURSE
// ============================================================

async function deleteCourse(id) {

    if (
        !confirm(
            'Are you sure you want to delete this course?'
        )
    ) {
        return;
    }

    const success =
        await deleteData(
            'courses',
            id
        );

    if (!success) {
        return;
    }

    courses =
        courses.filter(
            course =>
                String(course.id) !==
                String(id)
        );

    updateDashboard();

    renderCoursesTable();

    switchTab(
        'courses'
    );

    showNotification(
        'Course deleted successfully.',
        'success'
    );

    await fetchAllData();

    switchTab(
        'courses'
    );
}

// ============================================================
// MARKS TABLE
// ============================================================

function renderMarksTable() {

    const tbody =
        document.querySelector(
            '#marks-table tbody'
        );

    if (!tbody) {
        return;
    }

    tbody.innerHTML = '';

    marks
        .slice(-10)
        .reverse()
        .forEach(mark => {

            const student =
                students.find(
                    s =>
                        String(s.id) ===
                        String(mark.studentId)
                );

            const course =
                courses.find(
                    c =>
                        String(c.id) ===
                        String(mark.courseId)
                );

            if (!student || !course) {
                return;
            }

            const row =
                document.createElement('tr');

            row.innerHTML = `

                <td>
                    ${student.fullName}
                </td>

                <td>
                    ${course.name}
                </td>

                <td>
                    ${mark.cat1}
                </td>

                <td>
                    ${mark.cat2}
                </td>

                <td>
                    ${Number(mark.cat1 || 0) +
                    Number(mark.cat2 || 0)}
                </td>

                <td>
                    ${mark.exam}
                </td>

                <td class="font-weight-bold">
                    ${mark.total}
                </td>

                <td>
                    <span class="badge badge-grade grade-${mark.grade}">
                        ${mark.grade}
                    </span>
                </td>

                <td>
                    <span class="status">
                        ${mark.status}
                    </span>
                </td>

                <td>

                    <button
                        class="icon-btn delete-btn"
                        onclick="deleteMark('${mark.id}')"
                    >
                        <i class="fas fa-trash"></i>
                    </button>

                </td>

            `;

            tbody.appendChild(row);

        });
}

// ============================================================
// ADD MARKS
// ============================================================

async function addMarks(e) {

    e.preventDefault();

    const form =
        e.target;

    const formData =
        new FormData(form);

    const cat1 =
        parseFloat(
            formData.get(
                'cat1'
            )
        ) || 0;

    const cat2 =
        parseFloat(
            formData.get(
                'cat2'
            )
        ) || 0;

    const exam =
        parseFloat(
            formData.get(
                'main_exam'
            )
        ) || 0;

    const total =
        cat1 +
        cat2 +
        exam;

    let grade;
    let status;

    if (total >= 70) {

        grade = 'A';
        status = 'Excellent';

    } else if (total >= 60) {

        grade = 'B';
        status = 'Good';

    } else if (total >= 50) {

        grade = 'C';
        status = 'Average';

    } else if (total >= 40) {

        grade = 'D';
        status = 'Pass';

    } else {

        grade = 'F';
        status = 'Fail';

    }

    const mark = {

        id:
            'm' +
            Date.now(),

        studentId:
            document.getElementById(
                'marks-student-select'
            ).value,

        courseId:
            document.getElementById(
                'marks-course-select'
            ).value,

        cat1,

        cat2,

        exam,

        total,

        grade,

        status

    };

    const result =
        await postData(
            'marks',
            mark
        );

    if (!result) {
        return;
    }

    await fetchAllData();

    closeModal(
        'add-marks-modal'
    );

    form.reset();

    renderMarksTable();

    switchTab(
        'enter-marks'
    );

    showNotification(
        'Marks added successfully.',
        'success'
    );
}

// ============================================================
// MARKS INPUT PREVIEW
// ============================================================

function handleMarksInput() {

    const form =
        document.getElementById(
            'add-marks-form'
        );

    if (!form) {
        return;
    }

    const cat1 =
        parseFloat(
            form.cat1.value
        ) || 0;

    const cat2 =
        parseFloat(
            form.cat2.value
        ) || 0;

    const exam =
        parseFloat(
            form.main_exam.value
        ) || 0;

    const catTotal =
        cat1 +
        cat2;

    const grandTotal =
        catTotal +
        exam;

    document.getElementById(
        'cat-total'
    ).textContent =
        catTotal;

    document.getElementById(
        'grand-total'
    ).textContent =
        grandTotal;

    document.getElementById(
        'preview-total'
    ).textContent =
        `${grandTotal}%`;

    let grade = '-';
    let status = '-';

    if (grandTotal >= 70) {

        grade = 'A';
        status = 'Excellent';

    } else if (grandTotal >= 60) {

        grade = 'B';
        status = 'Good';

    } else if (grandTotal >= 50) {

        grade = 'C';
        status = 'Average';

    } else if (grandTotal >= 40) {

        grade = 'D';
        status = 'Pass';

    } else if (grandTotal > 0) {

        grade = 'F';
        status = 'Fail';

    }

    document.getElementById(
        'preview-grade'
    ).textContent =
        grade;

    document.getElementById(
        'preview-status'
    ).textContent =
        status;
}

// ============================================================
// DELETE MARK
// ============================================================

async function deleteMark(id) {

    if (
        !confirm(
            'Are you sure you want to delete this mark?'
        )
    ) {
        return;
    }

    const success =
        await deleteData(
            'marks',
            id
        );

    if (!success) {
        return;
    }

    marks =
        marks.filter(
            mark =>
                String(mark.id) !==
                String(id)
        );

    updateDashboard();

    renderMarksTable();

    switchTab(
        'enter-marks'
    );

    showNotification(
        'Mark deleted successfully.',
        'success'
    );

    await fetchAllData();

    switchTab(
        'enter-marks'
    );
}

// ============================================================
// ANALYTICS
// ============================================================

function renderAnalytics() {

    const programData = {};

    programs.forEach(program => {

        programData[
            program.name
        ] = {

            totalGPA: 0,

            count: 0

        };

    });

    students.forEach(student => {

        const studentMarks =
            marks.filter(
                mark =>
                    String(mark.studentId) ===
                    String(student.id)
            );

        if (
            studentMarks.length === 0
        ) {
            return;
        }

        let totalPoints = 0;

        let totalCredits = 0;

        studentMarks.forEach(record => {

            const course =
                courses.find(
                    c =>
                        String(c.id) ===
                        String(record.courseId)
                );

            if (!course) {
                return;
            }

            const points = {

                A: 4,

                B: 3,

                C: 2,

                D: 1,

                F: 0

            }[
                record.grade
            ] || 0;

            const credits =
                Number(
                    course.credits
                ) || 0;

            totalPoints +=
                points *
                credits;

            totalCredits +=
                credits;

        });

        if (
            totalCredits > 0 &&
            programData[
                student.program
            ]
        ) {

            programData[
                student.program
            ].totalGPA +=
                totalPoints /
                totalCredits;

            programData[
                student.program
            ].count++;

        }

    });

    const programLabels =
        Object.keys(
            programData
        );

    const programAverages =
        programLabels.map(
            label =>

                programData[
                    label
                ].count > 0

                    ? (

                        programData[
                            label
                        ].totalGPA /

                        programData[
                            label
                        ].count

                    ).toFixed(2)

                    : 0

        );

    const progCtx =
        document
            .getElementById(
                'programPerformanceChart'
            )
            ?.getContext('2d');

    if (progCtx) {

        if (window.progChart) {

            window.progChart.destroy();

        }

        window.progChart =
            new Chart(
                progCtx,
                {

                    type: 'bar',

                    data: {

                        labels:
                            programLabels,

                        datasets: [{

                            label:
                                'Average GPA',

                            data:
                                programAverages,

                            backgroundColor:
                                '#4e73df'

                        }]

                    },

                    options: {

                        responsive: true,

                        maintainAspectRatio:
                            false,

                        plugins: {

                            legend: {

                                display: false

                            }

                        }

                    }

                }
            );

    }

    const yearData = {

        '1': 0,

        '2': 0,

        '3': 0,

        '4': 0

    };

    students.forEach(student => {

        if (
            yearData[
                student.year
            ] !== undefined
        ) {

            yearData[
                student.year
            ]++;

        }

    });

    const studentProgCtx =
        document
            .getElementById(
                'studentProgressionChart'
            )
            ?.getContext('2d');

    if (studentProgCtx) {

        if (
            window.studentProgChart
        ) {

            window.studentProgChart.destroy();

        }

        window.studentProgChart =
            new Chart(
                studentProgCtx,
                {

                    type: 'pie',

                    data: {

                        labels: [

                            'Year 1',

                            'Year 2',

                            'Year 3',

                            'Year 4'

                        ],

                        datasets: [{

                            data:
                                Object.values(
                                    yearData
                                ),

                            backgroundColor: [

                                '#4e73df',

                                '#1cc88a',

                                '#36b9cc',

                                '#f6c23e'

                            ]

                        }]

                    },

                    options: {

                        responsive: true,

                        maintainAspectRatio:
                            false

                    }

                }
            );

    }

    if (
        programAverages.length > 0
    ) {

        const avgGPAs =
            programAverages.map(
                value =>
                    parseFloat(
                        value
                    )
            );

        const maxGPA =
            Math.max(
                ...avgGPAs
            );

        const topProg =
            programLabels[
                avgGPAs.indexOf(
                    maxGPA
                )
            ];

        const topProgram =
            document.getElementById(
                'top-program'
            );

        if (topProgram) {

            topProgram.textContent =
                topProg ||
                'N/A';

        }

        const trendEl =
            document.getElementById(
                'performance-trend'
            );

        if (trendEl) {

            trendEl.textContent =
                `Avg: ${(
                    avgGPAs.reduce(
                        (a, b) =>
                            a + b,
                        0
                    ) /
                    avgGPAs.length
                ).toFixed(2)}`;

        }

    }

}

// ============================================================
// RESULTS / TRANSCRIPT
// ============================================================

function generateResults() {

    const studentId =
        document.getElementById(
            'results-student-select'
        )?.value;

    if (!studentId) {
        return;
    }

    const student =
        students.find(
            s =>
                String(s.id) ===
                String(studentId)
        );

    const container =
        document.getElementById(
            'student-report-card'
        );

    if (!student || !container) {
        return;
    }

    const studentMarks =
        marks.filter(
            mark =>
                String(mark.studentId) ===
                String(studentId)
        );

    let totalPoints = 0;

    let totalCredits = 0;

    let coursesData = [];

    studentMarks.forEach(mark => {

        const course =
            courses.find(
                c =>
                    String(c.id) ===
                    String(mark.courseId)
            );

        if (!course) {
            return;
        }

        const gradePoints = {

            A: 4,

            B: 3,

            C: 2,

            D: 1,

            F: 0

        };

        const points =
            gradePoints[
                mark.grade
            ] || 0;

        const credits =
            Number(
                course.credits
            ) || 0;

        totalPoints +=
            points *
            credits;

        totalCredits +=
            credits;

        coursesData.push({

            code:
                course.code,

            name:
                course.name,

            credits,

            cat1:
                mark.cat1,

            cat2:
                mark.cat2,

            exam:
                mark.exam,

            total:
                mark.total,

            grade:
                mark.grade,

            points

        });

    });

    const overallGPA =
        totalCredits > 0

            ? (
                totalPoints /
                totalCredits
            ).toFixed(2)

            : '0.00';

    const gpa =
        parseFloat(
            overallGPA
        );

    let overallGrade;

    let classification;

    if (gpa >= 3.6) {

        overallGrade = 'A';

        classification =
            'First Class Honours';

    } else if (gpa >= 3.0) {

        overallGrade = 'B+';

        classification =
            'Second Class Upper';

    } else if (gpa >= 2.5) {

        overallGrade = 'B';

        classification =
            'Second Class Lower';

    } else if (gpa >= 2.0) {

        overallGrade = 'C';

        classification =
            'Pass';

    } else {

        overallGrade = 'D';

        classification =
            'Fail';

    }

    const html = `

        <div
            class="transcript-container"
            id="transcript-content"
        >

            <div class="transcript-header">

                <div class="university-info">

                    <h1 class="university-name">
                        GARISSA UNIVERSITY
                    </h1>

                    <div class="university-meta">

                        <p>
                            P.O. Box 1801 - 70100,
                            Garissa, Kenya
                        </p>

                        <p>
                            Tel: +254-123-456789 |
                            Email:
                            info@garissauniversity.ac.ke
                        </p>

                        <p>
                            Website:
                            www.garissauniversity.ac.ke
                        </p>

                    </div>

                </div>

                <div class="transcript-title">

                    <h2>
                        OFFICIAL ACADEMIC TRANSCRIPT
                    </h2>

                    <div class="seal-container">

                        <div class="seal">
                            SEAL
                        </div>

                    </div>

                </div>

            </div>

            <div class="student-info-section">

                <table class="info-table">

                    <tr>
                        <th>
                            STUDENT NAME:
                        </th>

                        <td>
                            <strong>
                                ${student.fullName}
                            </strong>
                        </td>
                    </tr>

                    <tr>
                        <th>
                            REGISTRATION NUMBER:
                        </th>

                        <td>
                            <strong>
                                ${student.regNumber}
                            </strong>
                        </td>
                    </tr>

                    <tr>
                        <th>
                            PROGRAM:
                        </th>

                        <td>
                            ${student.program}
                        </td>
                    </tr>

                    <tr>
                        <th>
                            ADMISSION YEAR:
                        </th>

                        <td>
                            ${student.admissionYear || ''}
                        </td>
                    </tr>

                    <tr>
                        <th>
                            ACADEMIC YEAR:
                        </th>

                        <td>
                            Year ${student.year},
                            Semester ${student.semester}
                        </td>
                    </tr>

                    <tr>
                        <th>
                            DATE OF ISSUE:
                        </th>

                        <td>
                            ${new Date().toLocaleDateString(
                                'en-US',
                                {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                }
                            )}
                        </td>
                    </tr>

                </table>

            </div>

            <div class="performance-summary">

                <div class="summary-card">

                    <h4>
                        Overall GPA
                    </h4>

                    <div class="gpa-value">
                        ${overallGPA}
                    </div>

                </div>

                <div class="summary-card">

                    <h4>
                        Overall Grade
                    </h4>

                    <div class="grade-value">
                        ${overallGrade}
                    </div>

                </div>

                <div class="summary-card">

                    <h4>
                        Classification
                    </h4>

                    <div class="classification">
                        ${classification}
                    </div>

                </div>

                <div class="summary-card">

                    <h4>
                        Total Credits
                    </h4>

                    <div class="credits-value">
                        ${totalCredits}
                    </div>

                </div>

            </div>

            <div class="courses-section">

                <h3 class="section-title">
                    ACADEMIC PERFORMANCE
                </h3>

                <table class="transcript-table">

                    <thead>

                        <tr>

                            <th>
                                Course Code
                            </th>

                            <th>
                                Course Title
                            </th>

                            <th>
                                Credits
                            </th>

                            <th>
                                CAT 1
                            </th>

                            <th>
                                CAT 2
                            </th>

                            <th>
                                Exam
                            </th>

                            <th>
                                Total
                            </th>

                            <th>
                                Grade
                            </th>

                            <th>
                                Points
                            </th>

                        </tr>

                    </thead>

                    <tbody>

                        ${coursesData.map(
                            course => `

                            <tr>

                                <td>
                                    <strong>
                                        ${course.code}
                                    </strong>
                                </td>

                                <td>
                                    ${course.name}
                                </td>

                                <td>
                                    ${course.credits}
                                </td>

                                <td>
                                    ${course.cat1}
                                </td>

                                <td>
                                    ${course.cat2}
                                </td>

                                <td>
                                    ${course.exam}
                                </td>

                                <td>
                                    <strong>
                                        ${course.total}
                                    </strong>
                                </td>

                                <td>

                                    <span
                                        class="grade-badge grade-${course.grade}"
                                    >
                                        ${course.grade}
                                    </span>

                                </td>

                                <td>
                                    ${course.points}
                                </td>

                            </tr>

                        `
                        ).join('')}

                    </tbody>

                </table>

            </div>

        </div>

        <div
            class="transcript-actions"
            style="margin-top:2rem;text-align:center;"
        >

            <button
                class="btn btn-primary"
                onclick="printTranscript()"
            >

                <i class="fas fa-print"></i>

                Print Transcript

            </button>

            <button
                class="btn btn-success"
                onclick="downloadTranscript()"
            >

                <i class="fas fa-download"></i>

                Download as PDF

            </button>

        </div>

    `;

    container.innerHTML =
        html;

    container.classList.remove(
        'hidden'
    );

    container.style.display =
        'block';
}

// ============================================================
// PRINT TRANSCRIPT
// ============================================================

function printTranscript() {

    const transcriptContent =
        document.getElementById(
            'transcript-content'
        );

    if (!transcriptContent) {

        showNotification(
            'No transcript content found.',
            'danger'
        );

        return;
    }

    const printWindow =
        window.open(
            '',
            '_blank'
        );

    if (!printWindow) {

        showNotification(
            'Please allow pop-ups to print the transcript.',
            'danger'
        );

        return;
    }

    printWindow.document.write(`

        <!DOCTYPE html>

        <html>

        <head>

            <title>
                Academic Transcript
            </title>

            <style>

                body {

                    font-family:
                        Arial,
                        sans-serif;

                    margin:
                        0;

                    padding:
                        20px;

                    color:
                        #333;

                }

                .transcript-container {

                    max-width:
                        1000px;

                    margin:
                        0 auto;

                    background:
                        white;

                }

                table {

                    width:
                        100%;

                    border-collapse:
                        collapse;

                }

                th,
                td {

                    padding:
                        10px;

                    border:
                        1px solid #ddd;

                }

                th {

                    background:
                        #4e73df;

                    color:
                        white;

                }

                .performance-summary {

                    display:
                        flex;

                    gap:
                        10px;

                    margin:
                        20px 0;

                }

                .summary-card {

                    flex:
                        1;

                    padding:
                        15px;

                    text-align:
                        center;

                    background:
                        #4e73df;

                    color:
                        white;

                }

                .grade-A {
                    background:
                        #1cc88a;
                }

                .grade-B {
                    background:
                        #36b9cc;
                }

                .grade-C {
                    background:
                        #f6c23e;
                }

                .grade-D {
                    background:
                        #e74a3b;
                }

                .grade-F {
                    background:
                        #858796;
                }

                @media print {

                    body {

                        padding:
                            0;

                    }

                }

            </style>

        </head>

        <body>

            ${transcriptContent.innerHTML}

            <script>

                window.onload =
                    function() {

                        window.print();

                    };

            <\/script>

        </body>

        </html>

    `);

    printWindow.document.close();

    showNotification(
        'Opening print dialog...',
        'info'
    );
}

// ============================================================
// DOWNLOAD TRANSCRIPT
// ============================================================

function downloadTranscript() {

    printTranscript();

    showNotification(
        'Use the print dialog to save as PDF.',
        'info'
    );
}

// ============================================================
// POPULATE SELECTS
// ============================================================

function populateStudentSelect(id) {

    const element =
        document.getElementById(
            id
        );

    if (!element) {
        return;
    }

    element.innerHTML =

        '<option value="">Select Student</option>' +

        students.map(
            student =>

                `<option value="${student.id}">
                    ${student.regNumber}
                    -
                    ${student.fullName}
                </option>`

        ).join('');
}

function populateCourseSelect(id) {

    const element =
        document.getElementById(
            id
        );

    if (!element) {
        return;
    }

    element.innerHTML =

        '<option value="">Select Course</option>' +

        courses.map(
            course =>

                `<option value="${course.id}">
                    ${course.code}
                    -
                    ${course.name}
                </option>`

        ).join('');
}

// ============================================================
// MODALS
// ============================================================

function openModal(id) {

    const modal =
        document.getElementById(
            id
        );

    if (!modal) {
        return;
    }

    modal.style.display =
        'block';

    if (
        id ===
        'add-marks-modal'
    ) {

        populateStudentSelect(
            'marks-student-select'
        );

        populateCourseSelect(
            'marks-course-select'
        );

    }

}

function closeModal(id) {

    const modal =
        document.getElementById(
            id
        );

    if (modal) {

        modal.style.display =
            'none';

    }

}

// ============================================================
// VIEW STUDENT DETAILS
// ============================================================

function viewStudentDetails(id) {

    switchTab(
        'results'
    );

    setTimeout(
        () => {

            const select =
                document.getElementById(
                    'results-student-select'
                );

            if (select) {

                select.value =
                    id;

                generateResults();

            }

        },
        100
    );
}

// ============================================================
// NOTIFICATIONS
// ============================================================

function showNotification(
    message,
    type = 'info'
) {

    const notification =
        document.createElement(
            'div'
        );

    notification.className =
        `notification notification-${type}`;

    notification.innerHTML = `

        <i class="fas fa-info-circle"></i>

        <span>
            ${message}
        </span>

    `;

    document.body.appendChild(
        notification
    );

    setTimeout(
        () => {

            notification.remove();

        },
        3000
    );
}

// ============================================================
// EVENT LISTENERS
// ============================================================

function setupEventListeners() {

    // Tab buttons

    document
        .querySelectorAll(
            '.tab-btn'
        )
        .forEach(btn => {

            btn.addEventListener(
                'click',
                function(e) {

                    e.preventDefault();

                    const tabId =
                        this.getAttribute(
                            'data-tab'
                        );

                    switchTab(
                        tabId
                    );

                }
            );

        });

    // Touch effects

    document
        .querySelectorAll(
            '.tab-btn, .btn, .action-btn'
        )
        .forEach(btn => {

            btn.addEventListener(
                'touchstart',
                function() {

                    this.classList.add(
                        'touch-active'
                    );

                }
            );

            btn.addEventListener(
                'touchend',
                function() {

                    this.classList.remove(
                        'touch-active'
                    );

                }
            );

        });

    // Forms

    document
        .getElementById(
            'add-student-form'
        )
        ?.addEventListener(
            'submit',
            addStudent
        );

    document
        .getElementById(
            'edit-student-form'
        )
        ?.addEventListener(
            'submit',
            updateStudent
        );

    document
        .getElementById(
            'add-course-form'
        )
        ?.addEventListener(
            'submit',
            addCourse
        );

    document
        .getElementById(
            'edit-course-form'
        )
        ?.addEventListener(
            'submit',
            updateCourse
        );

    document
        .getElementById(
            'add-marks-form'
        )
        ?.addEventListener(
            'submit',
            addMarks
        );

    document
        .getElementById(
            'add-marks-form'
        )
        ?.addEventListener(
            'input',
            handleMarksInput
        );

    // Refresh

    document
        .getElementById(
            'refresh-btn'
        )
        ?.addEventListener(
            'click',
            refreshData
        );

    // Generate results

    document
        .getElementById(
            'generate-results-btn'
        )
        ?.addEventListener(
            'click',
            generateResults
        );

    // Search students

    document
        .getElementById(
            'search-student'
        )
        ?.addEventListener(
            'input',
            e => {

                renderStudentsTable(
                    e.target.value
                );

            }
        );

    // Search courses

    document
        .getElementById(
            'search-course'
        )
        ?.addEventListener(
            'input',
            e => {

                renderCoursesTable(
                    e.target.value
                );

            }
        );

    // Program filters

    document
        .querySelectorAll(
            '.filter-btn'
        )
        .forEach(btn => {

            btn.addEventListener(
                'click',
                function() {

                    document
                        .querySelectorAll(
                            '.filter-btn'
                        )
                        .forEach(
                            button =>
                                button.classList.remove(
                                    'active'
                                )
                        );

                    this.classList.add(
                        'active'
                    );

                    renderStudentsTable(
                        '',
                        this.dataset.program
                    );

                }
            );

        });

    // Semester filters

    document
        .querySelectorAll(
            '.sem-btn'
        )
        .forEach(btn => {

            btn.addEventListener(
                'click',
                function() {

                    document
                        .querySelectorAll(
                            '.sem-btn'
                        )
                        .forEach(
                            button =>
                                button.classList.remove(
                                    'active'
                                )
                        );

                    this.classList.add(
                        'active'
                    );

                    renderCoursesTable(
                        '',
                        this.dataset.semester
                    );

                }
            );

        });

    // Reload data

    document
        .getElementById(
            'load-sample-btn'
        )
        ?.addEventListener(
            'click',
            async () => {

                await fetchAllData();

                // Stay on current tab
                switchTab(
                    currentTab
                );

                showNotification(
                    'Data reloaded successfully.',
                    'success'
                );

            }
        );

    // Clear data

    document
        .getElementById(
            'clear-data-btn'
        )
        ?.addEventListener(
            'click',
            () => {

                alert(
                    'Clear data requires backend intervention or manual db.json reset.'
                );

            }
        );

    // User dropdown

    document
        .getElementById(
            'userDropdown'
        )
        ?.addEventListener(
            'click',
            function(e) {

                e.stopPropagation();

                document
                    .getElementById(
                        'userDropdownMenu'
                    )
                    ?.classList.toggle(
                        'show'
                    );

            }
        );

    // Close dropdown

    window.addEventListener(
        'click',
        function() {

            document
                .getElementById(
                    'userDropdownMenu'
                )
                ?.classList.remove(
                    'show'
                );

        }
    );

}

// ============================================================
// REFRESH DATA
// ============================================================

async function refreshData() {

    const tabToRestore =
        currentTab;

    await fetchAllData();

    // Restore current page
    switchTab(
        tabToRestore
    );

    showNotification(
        'Data refreshed successfully.',
        'success'
    );
}

// ============================================================
// LOGOUT
// ============================================================

function logout() {

    localStorage.removeItem(
        'userSession'
    );

    window.location.href =
        'login.html';
}

// ============================================================
// TRANSCRIPT CSS
// ============================================================

function addTranscriptCSS() {

    if (
        document.getElementById(
            'transcript-styles'
        )
    ) {
        return;
    }

    const style =
        document.createElement(
            'style'
        );

    style.id =
        'transcript-styles';

    style.textContent = `

        .transcript-container {

            background:
                white;

            padding:
                2rem;

            border-radius:
                8px;

            box-shadow:
                0 0 20px
                rgba(0,0,0,0.1);

            max-width:
                1000px;

            margin:
                0 auto;

        }

        .transcript-header {

            text-align:
                center;

            border-bottom:
                3px solid
                #4e73df;

            padding-bottom:
                1rem;

            margin-bottom:
                2rem;

        }

        .university-name {

            color:
                #2e59d9;

            font-size:
                2rem;

            margin-bottom:
                0.5rem;

        }

        .university-meta {

            color:
                #666;

            font-size:
                0.9rem;

        }

        .seal {

            width:
                80px;

            height:
                80px;

            border:
                2px dashed
                #2e59d9;

            border-radius:
                50%;

            display:
                flex;

            align-items:
                center;

            justify-content:
                center;

            color:
                #2e59d9;

            font-weight:
                bold;

        }

        .student-info-section {

            background:
                #f8f9fc;

            padding:
                1.5rem;

            border-radius:
                8px;

            margin-bottom:
                2rem;

            border-left:
                4px solid
                #4e73df;

        }

        .info-table {

            width:
                100%;

            border-collapse:
                collapse;

        }

        .info-table th,
        .info-table td {

            padding:
                8px;

            text-align:
                left;

        }

        .performance-summary {

            display:
                grid;

            grid-template-columns:
                repeat(
                    auto-fit,
                    minmax(
                        200px,
                        1fr
                    )
                );

            gap:
                1rem;

            margin-bottom:
                2rem;

        }

        .summary-card {

            background:
                linear-gradient(
                    135deg,
                    #667eea 0%,
                    #764ba2 100%
                );

            color:
                white;

            padding:
                1rem;

            border-radius:
                8px;

            text-align:
                center;

        }

        .gpa-value,
        .grade-value,
        .credits-value {

            font-size:
                2rem;

            font-weight:
                bold;

        }

        .classification {

            font-size:
                1.2rem;

            font-weight:
                bold;

        }

        .transcript-table,
        .grading-table {

            width:
                100%;

            border-collapse:
                collapse;

            margin-bottom:
                2rem;

        }

        .transcript-table th {

            background:
                #4e73df;

            color:
                white;

        }

        .transcript-table th,
        .transcript-table td,
        .grading-table th,
        .grading-table td {

            padding:
                10px;

            border:
                1px solid
                #e3e6f0;

        }

        .grade-badge {

            display:
                inline-block;

            padding:
                4px 12px;

            border-radius:
                20px;

            font-weight:
                bold;

            color:
                white;

        }

        .grade-A {
            background:
                #1cc88a;
        }

        .grade-B {
            background:
                #36b9cc;
        }

        .grade-C {
            background:
                #f6c23e;
        }

        .grade-D {
            background:
                #e74a3b;
        }

        .grade-F {
            background:
                #858796;
        }

    `;

    document.head.appendChild(
        style
    );
}

// ============================================================
// GLOBAL FUNCTIONS
// Required for inline onclick="" in HTML
// ============================================================

window.openModal =
    openModal;

window.closeModal =
    closeModal;

window.switchTab =
    switchTab;

window.editStudent =
    editStudent;

window.deleteStudent =
    deleteStudent;

window.editCourse =
    editCourse;

window.deleteCourse =
    deleteCourse;

window.deleteMark =
    deleteMark;

window.viewStudentDetails =
    viewStudentDetails;

window.generateResults =
    generateResults;

window.printTranscript =
    printTranscript;

window.downloadTranscript =
    downloadTranscript;

window.logout =
    logout;

window.refreshData =
    refreshData;
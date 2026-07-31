We're building an attendance monitoring system with the following workflow:

---

## Workflow

### Initialization phase

The user of the system must create or select an existing event in which the registration and attendance is linked to. This is so that this system can be reused for multiple events.

### Registration phase

Because we don't have access to official student records database, Students must fill out a Google form with the following details:

- Student ID number (e.g. 123456)
- First name (e.g. John)
- Last name (e.g. Doe)
- Year level (dropdown: e.g. 1st year)
- Course (dropdown: e.g. BSCS)

These inputs may have validation checks to ensure that the data is consistent.

### Deadline

The Google form is closed and the results are sanitized and downloaded as a CSV file to be uploaded to the system.

#### Sanity check

The user may check the CSV file to ensure that the data that the students have entered is correct, and handle any cases of duplication or false entries.

### Attendance phase

- Students must have the barcode of their ID scanned by the camera.
- Their student ID number is retrieved from the scanned barcode.
- Using the student ID number, the system searches for their student information such as first name, last name, year level, and course from the database.
- If the student information is found, the system displays "Welcome, {first name} {last name}" for a brief period for visual feedback and confirmation, and their attendance is recorded in the system with timestamp.
- If the student information is not found, the system displays "This student ID number is not registered." for a brief period for visual feedback and confirmation.

The attendance for the event may take place in multiple sessions such as morning/afternoon, entrance/exit, etc. depending on the event and can only be recorded once for each session.

### Results phase

The system generates a report of the attendance and exports it to an Excel file.

---

Can you build the React frontend on top of this Laravel backend based on this workflow?
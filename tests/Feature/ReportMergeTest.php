<?php

use App\Models\Event;
use Illuminate\Http\UploadedFile;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

function makeReportFile(array $rows, array $sessions = ['Morning', 'Afternoon']): UploadedFile
{
    $spreadsheet = new Spreadsheet();
    $sheet = $spreadsheet->getActiveSheet();

    $headers = ['Student ID', 'First Name', 'Last Name', 'Year Level', 'Course', ...$sessions];
    $sheet->fromArray($headers, null, 'A1');

    $rowIndex = 2;
    foreach ($rows as $row) {
        $line = [
            $row['student_id'],
            $row['first_name'],
            $row['last_name'],
            $row['year_level'] ?? '1st year',
            $row['course'] ?? 'BSCS',
        ];
        foreach ($sessions as $session) {
            $line[] = $row['attendance'][$session] ?? 'Absent';
        }
        $sheet->fromArray($line, null, "A{$rowIndex}");
        $rowIndex++;
    }

    $writer = new Xlsx($spreadsheet);
    $path = tempnam(sys_get_temp_dir(), 'report') . '.xlsx';
    $writer->save($path);

    return new UploadedFile($path, 'report.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', null, true);
}

function loadResponseSpreadsheet(Illuminate\Testing\TestResponse $response): Spreadsheet
{
    $path = tempnam(sys_get_temp_dir(), 'merged') . '.xlsx';
    file_put_contents($path, $response->streamedContent());

    return \PhpOffice\PhpSpreadsheet\IOFactory::load($path);
}

test('merge reports unions present marks across devices', function () {
    $event = Event::factory()->create(['name' => 'Orientation']);

    // Device A: student A attended, B and C absent.
    $deviceA = makeReportFile([
        ['student_id' => '111', 'first_name' => 'Alice', 'last_name' => 'Alpha', 'attendance' => ['Morning' => '2026-08-01 07:30:00', 'Afternoon' => '2026-08-01 13:10:00']],
        ['student_id' => '222', 'first_name' => 'Bob', 'last_name' => 'Beta', 'attendance' => ['Morning' => 'Absent', 'Afternoon' => 'Absent']],
        ['student_id' => '333', 'first_name' => 'Carol', 'last_name' => 'Gamma', 'attendance' => ['Morning' => 'Absent', 'Afternoon' => 'Absent']],
    ]);

    // Device B: student B attended, A and C absent.
    $deviceB = makeReportFile([
        ['student_id' => '111', 'first_name' => 'Alice', 'last_name' => 'Alpha', 'attendance' => ['Morning' => 'Absent', 'Afternoon' => 'Absent']],
        ['student_id' => '222', 'first_name' => 'Bob', 'last_name' => 'Beta', 'attendance' => ['Morning' => '2026-08-01 07:45:00', 'Afternoon' => '2026-08-01 13:20:00']],
        ['student_id' => '333', 'first_name' => 'Carol', 'last_name' => 'Gamma', 'attendance' => ['Morning' => 'Absent', 'Afternoon' => 'Absent']],
    ]);

    $response = $this->post("/api/v1/events/{$event->id}/reports/merge", [
        'files' => [$deviceA, $deviceB],
    ], ['Accept' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']);

    $response->assertOk();

    // Parse the returned xlsx and verify the merged detail sheet.
    $spreadsheet = loadResponseSpreadsheet($response);
    $detail = $spreadsheet->getSheetByName('Attendance');
    $summary = $spreadsheet->getSheetByName('Summary');

    $this->assertNotNull($detail);
    $this->assertNotNull($summary);

    $rows = $detail->toArray(null, true, true, true);

    // Header row
    $this->assertSame('Student ID', $rows[1]['A']);
    $this->assertSame('Morning', $rows[1]['F']);
    $this->assertSame('Afternoon', $rows[1]['G']);

    // Find rows by student id
    $byStudent = [];
    foreach (array_slice($rows, 1) as $row) {
        $byStudent[$row['A']] = $row;
    }

    // Alice present in both sessions (from device A)
    $this->assertNotSame('Absent', $byStudent['111']['F']);
    $this->assertNotSame('Absent', $byStudent['111']['G']);

    // Bob present in both sessions (from device B)
    $this->assertNotSame('Absent', $byStudent['222']['F']);
    $this->assertNotSame('Absent', $byStudent['222']['G']);

    // Carol absent in both
    $this->assertSame('Absent', $byStudent['333']['F']);
    $this->assertSame('Absent', $byStudent['333']['G']);

    // Summary: 2 present, 1 absent per session
    $summaryRows = $summary->toArray(null, true, true, true);
    $this->assertSame('2', (string) $summaryRows[2]['B']);
    $this->assertSame('1', (string) $summaryRows[2]['C']);
    $this->assertSame('3', (string) $summaryRows[2]['D']);
});

test('merge reports unions rosters when devices differ', function () {
    $event = Event::factory()->create();

    // Device A has Alice only; Device B has Bob only (roster drift).
    $deviceA = makeReportFile([
        ['student_id' => '111', 'first_name' => 'Alice', 'last_name' => 'Alpha', 'attendance' => ['Morning' => '2026-08-01 07:30:00']],
    ], ['Morning']);

    $deviceB = makeReportFile([
        ['student_id' => '222', 'first_name' => 'Bob', 'last_name' => 'Beta', 'attendance' => ['Morning' => '2026-08-01 07:45:00']],
    ], ['Morning']);

    $response = $this->post("/api/v1/events/{$event->id}/reports/merge", [
        'files' => [$deviceA, $deviceB],
    ], ['Accept' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']);

    $response->assertOk();

    $spreadsheet = loadResponseSpreadsheet($response);
    $detail = $spreadsheet->getSheetByName('Attendance');
    $rows = $detail->toArray(null, true, true, true);

    $byStudent = [];
    foreach (array_slice($rows, 1) as $row) {
        $byStudent[$row['A']] = $row;
    }

    $this->assertArrayHasKey('111', $byStudent);
    $this->assertArrayHasKey('222', $byStudent);
    $this->assertNotSame('Absent', $byStudent['111']['F']);
    $this->assertNotSame('Absent', $byStudent['222']['F']);
});

test('merge reports rejects mismatched session columns', function () {
    $event = Event::factory()->create();

    $deviceA = makeReportFile([
        ['student_id' => '111', 'first_name' => 'Alice', 'last_name' => 'Alpha', 'attendance' => ['Morning' => '2026-08-01 07:30:00']],
    ], ['Morning']);

    $deviceB = makeReportFile([
        ['student_id' => '111', 'first_name' => 'Alice', 'last_name' => 'Alpha', 'attendance' => ['Afternoon' => '2026-08-01 13:10:00']],
    ], ['Afternoon']);

    $response = $this->post("/api/v1/events/{$event->id}/reports/merge", [
        'files' => [$deviceA, $deviceB],
    ], ['Accept' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']);

    $response->assertStatus(500);
});

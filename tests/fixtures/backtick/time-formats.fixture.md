# Time format edge cases

This fixture tests that time ranges and temporal expressions are not incorrectly flagged as network addresses or other code elements.

## Should NOT be flagged (time ranges and formats)

The meeting runs from 9:00 AM-5:00 PM daily.

Office hours are 3-10:30 AM on weekdays.

Available Wednesday, January 1, 2020, from 3:00 AM to 12:30 PM EST.

Schedule: Jan 1, 3 AM-12:30 PM.

The event spans 2-6:45 PM EST (UTC-5).

Maintenance window: 11:30 PM-2:00 AM.

Sessions run 8-11:45 AM and 1-4:30 PM.

## Should NOT be flagged (date ranges)

The conference is October 15-18, 2024.

Project timeline: Q3-Q4 2024.

Fiscal year 2023-2024 results.

## Should be flagged (actual network addresses and ports)

Connect to `192.168.1.1:8080` for the admin panel.

The service runs on `localhost:3000` by default.

Database connection: `10.0.0.5:5432`.

## Should be flagged (version ranges and technical ranges)

Use Node.js version `18-20` or higher.

The port range `8000-9000` is reserved.

Support for Python `3.9-3.12` is included.

## Edge cases - hyphenated time expressions

The shift is 7-3 (meaning 7 AM to 3 PM).

Work schedule: 9-5 with lunch at noon.

Available 24-7 for emergency support (should this be backticked?).

## Mixed scenarios

The backup runs at 3:00 AM-4:00 AM, connecting to `backup-server:22`.

Schedule meetings between 9-11 AM using the `calendar-api` endpoint.

Monitor the `log-processor` output from 1-5 PM daily.

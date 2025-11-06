# Timezone and time-related abbreviations

This fixture tests that timezone codes and time-related abbreviations are correctly handled in headings.

## Should NOT be flagged (timezone abbreviations)

# Meeting schedule EST (UTC-5)

## Office hours PST (UTC-8)

### Event timing EDT (UTC-4)

#### Conference call PDT (UTC-7)

##### Support hours CST (UTC-6)

###### Release window MST (UTC-7)

## Timezone codes in sentences

# Available from 9 AM EST to 5 PM PST

## Working hours in UTC+0 timezone

### Schedule for GMT (UTC+0) operations

## Combined time and timezone

# Maintenance window 3:00 AM EST (UTC-5)

## Deployment schedule 11:00 PM PST (UTC-8)

### Backup timing 2:00 AM EDT (UTC-4)

## Multiple timezones

# Conference schedule EST/PST/GMT

## Support coverage 24/7 UTC

### Global meeting times (EST/CET/JST)

## Edge cases - other abbreviations

# Meeting at 3 PM ET

## Call scheduled for 9 AM PT

### Event begins 5 PM CT

## Should be flagged (not timezones)

# Important Meeting For All Teams

## Schedule Review And Planning

## UTC variants

# System time in UTC-5 format

## Logging timestamps in UTC+2

### Server timezone UTC-0 configuration

#### Database using UTC+8 offset

## Common timezone patterns

# EST to PST conversion

## GMT versus UTC differences

### Coordinating across EST/CST/MST/PST

## International timezones

# CET (Central European Time) schedule

## JST (Japan Standard Time) availability

### IST (India Standard Time) support

#### AEST (Australian Eastern Standard Time) events

## Should preserve

# Schedule for EST (UTC-5) region

## Planning in PST/PDT zones

### Global coverage 24/7 UTC

#### Maintenance window 2-4 AM EST

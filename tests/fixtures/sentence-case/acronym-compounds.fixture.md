# Acronym-prefixed compound words

This fixture tests that headings starting with acronyms followed by hyphens preserve the acronym capitalization while following sentence case for the rest.

## Should NOT be flagged (acronyms should stay uppercase)

# YAML-based configuration system

## API-driven architecture

### JSON-formatted responses

#### REST-based endpoints

##### SQL-based queries

###### HTML-rendered output

# XML-encoded data structures

## CSV-formatted exports

### PDF-generated reports

#### URL-encoded parameters

##### CLI-based tools

###### SDK-provided methods

## Acronyms in middle of heading

# Using YAML-based configs for deployment

## The API-driven approach to microservices

### Working with JSON-formatted data

## Multiple acronyms

# REST API-driven architecture

## HTML/CSS-based templates

### SQL/NoSQL-hybrid approach

## Should be flagged (no acronym involved)

# Json-based Configuration

## Api-Driven Architecture

### Rest-Based Endpoints

## Edge cases - looks like acronym but isn't

# USB-compatible devices (USB is acronym - should preserve)

## LED-backlit displays (LED is acronym - should preserve)

### GPS-enabled tracking (GPS is acronym - should preserve)

## All-caps words that aren't acronyms

# IMPORTANT-notice for users (questionable)

## BREAKING-changes in v2 (questionable)

## Acronym patterns to preserve

# HTTP-based protocols

## HTTPS-secured connections

### SSH-enabled access

#### FTP-deprecated warning

##### SMTP-relay configuration

###### DNS-based routing

# TCP-level debugging

## UDP-packet analysis

### IP-address validation

#### MAC-address filtering

##### VLAN-tagged traffic

###### VPN-tunneled connections

## Common tech acronyms

# AI-powered features

## ML-based predictions

### CI-driven deployments

#### CD-pipeline automation

##### IoT-connected devices

###### SaaS-based solutions

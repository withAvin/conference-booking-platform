# Conference Booking Platform

A conference booking platform with two roles: attendees browse and book
conferences, organizers manage them. The system enforces two business rules
at the moment of booking:

- **BR-01 Capacity** — confirmed bookings never exceed a conference's capacity
- **BR-02 No overlap** — an attendee cannot hold two confirmed bookings whose
  times overlap

## Stack

React (Create React App, Tailwind) · Node/Express · PostgreSQL

## Setup

_To follow._

## Architecture

_To follow._

## Known limitations

- Role is chosen at signup. In production, organizer accounts would be issued
  by an administrator.

## Deployment

_Public URL to follow._

## Attribution

Project structure and authentication scaffold adapted from the Task Manager
tutorial by rajuiit (https://github.com/rajuiit/taskmanager_aws_setup).

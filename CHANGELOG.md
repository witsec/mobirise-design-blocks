# Changelog

All notable changes to this project will be documented in this file.

## v4 (2020-02-23)

- Removed the publishing code, so it will never interfere with PHP anymore

## v3 (2020-01-02)

- Fixed a bug so code before !DOCTYPE is handled properly

## v2 (2019-12-29)

- Added fix to stop PHP code from getting crippled
- Added GitHub Actions CI pipeline to automatically generate mbrext files

## 0.8 (2019-04-04)

- Fixed PHP code being crippled in certain cases.

## 0.7 (2019-03-15)

- Overhauled the way the Design Blocks Gallery is loaded in Mobirise. You no longer have to first drag a block onto your page, you simply click the Gallery icon at the top of Mobirise
- The overhaul removed the hacky way that AMP support was implemented

## 0.6 (2019-02-24)

- Fixed an issue where if the user didn't open the components tab within 20 seconds, the Design Block wasn't added to the components tab in AMP
- Added a fix to restore crippled PHP tags. Unsure if this is really an extension issue, but it fixes it anyway

## 0.5 (2019-01-31)

- Changed the way the Design Blocks Gallery is loaded inside Mobirise
- Updated the Design Blocks Gallery
- Added popup notification if a Design Block fails to load

## 0.4 (2019-01-18)

- Added feature to remove elements using class "remove-on-publish". This is useful when certain things need to be visible inside Mobirise, but not on preview/publish

## 0.3 (2019-01-13)

- Added AMP support
- Updated support for custom HTML blocks (created with the Code Editor) by parsing CSS to JSON (just like a userblock.js and project.mobirise stores it)
- Updated opening the Gallery. The version of the extension and is sent, along with what template the user is currently using (Bootstrap or AMP). This can be used by the Gallery
- Added animated 'waiting' icon after activating a block. This is more clear to the user

## 0.2 (2019-01-06)

- Changed template JSON format. The extension now only accepts 'user block' format. This makes it even easier to exchange blocks.

## 0.1 (2019-01-05)

This is the initial release of the Design Blocks extension for Mobirise.
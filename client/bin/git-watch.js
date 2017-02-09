#! /usr/bin/env node
var EventSource = require('eventsource');
var shelljs = require("shelljs");
var foreverLib = require("../lib/forever-es.js");
var argv = require('yargs').boolean('i').default({
    "u": 'https://git.watch/events/',
    "x": 'make push',
    "i": false
}).describe('u', "Event URL.")
    .describe('x', "Command to execute on push.")
    .describe('i', "Execute on launch.")
    .help('h')
    .alias('h', 'help')
    .epilog("https://git.watch/\nhttps://www.scalawilliam.com/")
    .alias("push-execute", "x").argv;

var executeCommand = argv.x;

var url = require("../lib/url.js");

var repositoryUrl;
var getUrlResult = shelljs.exec('git config --get remote.origin.url', {silent: true});
if (getUrlResult.code == 0) {
    var cleanUrl = getUrlResult.stdout.replace("\n", "").replace("\r", "");
    repositoryUrl = url.transform(cleanUrl);
}

if (!repositoryUrl) {
    console.error("Repository URL not detected.");
    console.error("Make sure you're inside a GitHub/GitLab/BitBucket repository.");
    process.exit(1);
}

require('console-stamp')(console);

function execute() {
    console.log("Executing: '" + executeCommand + "'.");
    shelljs.exec(executeCommand);
}

if (argv['i']) {
    execute();
}

foreverLib.forever(function () {
    var es = new EventSource(argv.u);
    es.onopen = function (e) {
        console.log("Opened connection to '" + argv.u + "'.");
    };
    es.addEventListener('push', function (e) {
        if (e.data == repositoryUrl) {
            console.log("Received an event for '" + repositoryUrl + "'.");
            execute();
        }
    });
    return es;
});
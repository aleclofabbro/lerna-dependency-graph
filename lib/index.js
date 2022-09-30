#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const project_1 = require("@lerna/project");
const assert_1 = __importDefault(require("assert"));
const fs_1 = __importDefault(require("fs"));
const graphviz_1 = __importDefault(require("graphviz"));
const yargs_1 = __importDefault(require("yargs"));
const argv = yargs_1.default
    .help()
    .alias('help', 'h')
    .version()
    .alias('version', 'v')
    .options({
    graphvizCommand: {
        alias: 'c',
        default: 'dot',
        description: 'Graphviz command to use.',
        type: 'string',
    },
    graphvizDirectory: {
        alias: 'd',
        description: 'Graphviz directory, if not in PATH.',
        type: 'string',
    },
    outputFormat: {
        alias: 'f',
        description: 'Outputs the given format. If not given, outputs plain DOT.',
        type: 'string',
    },
    outputPath: {
        alias: 'o',
        description: 'File to write into. If not given, outputs on stdout.',
        type: 'string',
    },
}).argv;
(0, project_1.getPackages)().then((packages) => {
    const g = graphviz_1.default.digraph('G');
    g.use = argv.graphvizCommand;
    if (argv.graphvizDirectory) {
        g.setGraphVizPath(argv.graphvizDirectory);
    }
    packages.forEach((pkg) => {
        if (pkg.name === '@moodlenet/core') {
            return;
        }
        (0, assert_1.default)(pkg.peerDependencies, `no peerDependencies in ${pkg.name} !`);
        (0, assert_1.default)(pkg.devDependencies, `no devDependencies in ${pkg.name} !`);
        const peers = Object.entries(pkg.peerDependencies).map(([name, version]) => `${name}@${version}`);
        const devs = Object.entries(pkg.devDependencies).map(([name, version]) => `${name}@${version}`);
        (0, assert_1.default)(!!peers.filter((peer) => !devs.includes(peer)).length &&
            !!devs.filter((dev) => !peers.includes(dev)).length, `peers and dev deps not congruent in ${pkg.name}`);
        const node = g.addNode(pkg.name);
        if (pkg.private) {
            node.set('style', 'dashed');
        }
        if (pkg.dependencies) {
            Object.keys(pkg.dependencies).forEach((depName) => {
                if (packages.find((p) => p.name === depName)) {
                    g.addEdge(node, depName);
                }
            });
        }
        // if (pkg.devDependencies) {
        // 	Object.keys(pkg.devDependencies).forEach((depName) => {
        // 		if (packages.find((p) => p.name === depName)) {
        // 			const edge = g.addEdge(node, depName);
        // 			edge.set('style', 'dashed');
        // 		}
        // 	});
        // }
        if (pkg.peerDependencies) {
            Object.keys(pkg.peerDependencies).forEach((depName) => {
                if (packages.find((p) => p.name === depName)) {
                    const edge = g.addEdge(node, depName);
                    edge.set('style', 'dotted');
                }
            });
        }
    });
    if (argv.outputFormat) {
        if (argv.outputPath) {
            g.output(argv.outputFormat, argv.outputPath);
        }
        else {
            g.output(argv.outputFormat, (data) => process.stdout.write(data));
        }
    }
    else {
        const data = g.to_dot();
        if (argv.outputPath) {
            fs_1.default.writeFile(argv.outputPath, data, (err) => {
                if (err) {
                    console.error(err);
                    process.exit(1);
                }
            });
        }
        else {
            console.log(data);
        }
    }
});

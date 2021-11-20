import * as fs from 'fs';
import * as childProcess from 'child_process';
import * as glob from 'glob';

const git = (...args: string[]) => childProcess.spawnSync('git', args).stdout.toString().trim();

const getGitBaseDir = () => git('rev-parse', '--show-toplevel');
const getGitCommitHash = () => git('rev-parse', 'HEAD');
const getGitChangesSince = (commitHash: string) => git('diff', '--name-only', `${commitHash}..HEAD`).split(/\r?\n/);

export interface Options {
	namespace: string;
	trackingFile?: string;
	mode?: 'mtime' | 'git';
	triggers?: Record<string, string>;
}

export class IncrementalHelper {
	private minDate: Date;
	private startDate = new Date();
	private gitChangedFiles: Set<string>;
	private fstatData: fs.Stats | null = null;
	private changes: string[] = [];

	private namespace: string;
	private mode: 'mtime' | 'git';
	private trackingFile: string;
	private triggers: Record<string, string>;

	constructor({
		namespace,
		mode = 'mtime',
		trackingFile = '.incremental',
		triggers = {},
	}: Options) {
		const data = fs.existsSync(this.trackingFile) ? JSON.parse(fs.readFileSync(this.trackingFile, 'utf-8')) : {};


		if (mode === 'git') {
			if (!git().startsWith('usage:')) {
				throw new Error(`Git is not installed.`);
			}
			if (!getGitBaseDir().startsWith('fatal:')) {
				throw new Error(`Not a git repository.`);
			}

			this.gitChangedFiles = new Set(getGitChangesSince(getGitCommitHash()));
		} else {
			this.minDate = data[this.namespace] ? new Date(data[this.namespace]) : new Date(0);
		}
	}

	/**
	 * Gets the fstat data of the last isNew() call.
	 */
	public get fstat(): fs.Stats {
		if (this.mode === 'git') {
			throw new Error(`Currently in 'git' mode, which does not provide fstat data.`);
		}
		if (!this.fstatData) {
			throw new Error(`Call .isNew() first.`);
		}
		return this.fstatData;
	}

	/**
	 * isNew checks if a file is newer than the previous build time.
	 */
	public isNew(file: string): boolean {
		if (this.mode === 'git') {
			return this.gitChangedFiles.has(file);
		} else {
			this.fstatData = fs.fstatSync(fs.openSync(file, 'r'));
			return this.minDate < this.fstatData.mtime;
		}
	}

	/**
	 * Calling .finalize() will write the last build time to the `.incremental` file.
	 * The exact time written is when the IncrementalHelper class is created.
	 */
	public finalize() {
		const data = fs.existsSync(this.trackingFile) ? JSON.parse(fs.readFileSync(this.trackingFile, 'utf-8')) : {};
		data[this.namespace] = this.startDate;
		fs.writeFileSync(this.trackingFile, JSON.stringify(data, null, 2));
	}
}

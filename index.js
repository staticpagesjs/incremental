"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IncrementalHelper = void 0;
const fs = require("fs");
class IncrementalHelper {
    constructor(id, file = '.incremental') {
        this.id = id;
        this.file = file;
        this.startDate = new Date();
        this.fstatData = null;
        const data = fs.existsSync(this.file) ? JSON.parse(fs.readFileSync(this.file, 'utf-8')) : {};
        this.minDate = data[this.id] ? new Date(data[this.id]) : new Date(0);
    }
    /**
     * Gets the fstat data of the last isNew() call.
     */
    get fstat() {
        if (!this.fstatData) {
            throw new Error(`Call .isNew() first.`);
        }
        return this.fstatData;
    }
    /**
     * isNew checks if a file is newer than the previous build time.
     */
    isNew(file) {
        this.fstatData = fs.fstatSync(fs.openSync(file, 'r'));
        return this.minDate < this.fstatData.mtime;
    }
    /**
     * Calling .finalize() will write the last build time to the `.incremental` file.
     * The exact time written is when the IncrementalHelper class is created.
     */
    finalize() {
        const data = fs.existsSync(this.file) ? JSON.parse(fs.readFileSync(this.file, 'utf-8')) : {};
        data[this.id] = this.startDate;
        fs.writeFileSync(this.file, JSON.stringify(data, null, 2));
    }
}
exports.IncrementalHelper = IncrementalHelper;

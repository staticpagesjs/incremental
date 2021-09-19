import * as fs from 'fs';

export class IncrementalHelper {
  private minDate: Date;
  private startDate = new Date();
  private fstatData: fs.Stats | null = null;

  constructor(
    private id: string,
    private file: string = '.incremental'
  ) {
    const data = fs.existsSync(this.file) ? JSON.parse(fs.readFileSync(this.file, 'utf-8')) : {};
    this.minDate = data[this.id] ? new Date(data[this.id]) : new Date(0);
  }

  /**
   * Gets the fstat data of the last isNew() call.
   */
  public get fstat(): fs.Stats {
    if (!this.fstatData) {
      throw new Error(`Call .isNew() first.`);
    }
    return this.fstatData;
  }

  /**
   * isNew checks if a file is newer than the previous build time.
   */
  public isNew(file: string): boolean {
    this.fstatData = fs.fstatSync(fs.openSync(file, 'r'));
    return this.minDate < this.fstatData.mtime;
  }

  /**
   * Calling .finalize() will write the last build time to the `.incremental` file.
   * The exact time written is when the IncrementalHelper class is created.
   */
  public finalize() {
    const data = fs.existsSync(this.file) ? JSON.parse(fs.readFileSync(this.file, 'utf-8')) : {};
    data[this.id] = this.startDate;
    fs.writeFileSync(this.file, JSON.stringify(data, null, 2));
  }
}

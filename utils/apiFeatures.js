const allowedPopulation = require("./allowedPopulation");

class APIFeatures {
  constructor(Model, queryParams, populateOptions) {
    this.Model = Model;
    this.query = Model.find(
      queryParams.specialFilter ? queryParams.specialFilter : {}
    );
    this.queryParams = queryParams;
    this.filterQuery = {};
    this.modelCount = 0;
    this.populateOptions = populateOptions;
  }

  filter() {
    if (this.queryParams.where) {
      let filterQueryArray = this.queryParams.where.split(",");
      let filterQueryObject = {};
      filterQueryArray.forEach((param) => {
        let isParamCountedFor = false;
        for (let operator of ["<=", ">=", ">", "<", "="]) {
          if (param.includes(operator) && !isParamCountedFor) {
            let paramName = param.split(operator)[0];
            let paramValue = param.split(operator)[1];
            if (operator === "=") filterQueryObject[paramName] = paramValue;
            else {
              let dbOperator =
                operator === "<="
                  ? "lte"
                  : operator === ">="
                  ? "gte"
                  : operator === ">"
                  ? "gt"
                  : "lt";
              if (!filterQueryObject[paramName])
                filterQueryObject[paramName] = {};
              filterQueryObject[paramName][`$${dbOperator}`] = +paramValue;
            }
            isParamCountedFor = true;
          }
        }
      });
      this.filterQuery = filterQueryObject;
      this.query = this.query.find(this.filterQuery);
    }
    return this;
  }

  sort() {
    if (this.queryParams.sort) {
      let sortquery = this.queryParams.sort.split(",").join(" ");
      this.query = this.query.sort(sortquery);
    }
    return this;
  }

  project() {
    let projection = (this.queryParams.fields || "")
      .split(",")
      .filter((el) => !el.toLowerCase().includes("password"))
      .join(" ");
    this.query = this.query.select(projection);
    return this;
  }

  paginate() {
    if (this.queryParams.limit !== "all")
      this.query = this.query.limit(+this.queryParams.limit || 10);
    if (+this.queryParams.page && this.queryParams.limit !== "all")
      this.query = this.query.skip(
        Math.max(0, +this.queryParams.page - 1) *
          (+this.queryParams.limit || 10)
      );
    return this;
  }

  populate() {
    if (this.queryParams.with && this.populateOptions) {
      allowedPopulation(this.queryParams.with, this.populateOptions).forEach(
        (ref) => {
          this.query = this.query.populate(ref);
        }
      );
    }
    return this;
  }

  async count() {
    if (this.queryParams.count !== false)
      this.modelCount = await this.Model.find(
        this.filterQuery
      ).estimatedDocumentCount();
    return this;
  }
}

module.exports = APIFeatures;

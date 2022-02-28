module.exports = (withParams, populateOptions) => {
  const clonedWithParams = withParams
    .split(",")
    .filter((ref) => populateOptions.find((el) => el === ref));
  const population = {};
  clonedWithParams.forEach((ref) => {
    if (!ref.includes(".")) {
      population[ref] = {
        path: ref,
      };
    } else {
      const childKey = ref.split(".")[0];
      if (population[childKey])
        population[childKey] = {
          ...population[childKey],
          populate: {
            path: ref.split(".")[1],
          },
        };
    }
  });
  return Object.values(population);
};

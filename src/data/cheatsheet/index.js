// Export all cheat sheet sections

import { executionOrderSection } from './execution-order';
import { basicsSection } from './basics';
import { filteringSection } from './filtering';
import { joinsSection } from './joins';
import { aggregatesSection } from './aggregates';
import { windowFunctionsSection } from './window-functions';
import { dateFunctionsSection } from './date-functions';
import { stringFunctionsSection } from './string-functions';
import { mathFunctionsSection } from './math-functions';
import { conditionalLogicSection } from './conditional-logic';
import { subqueriesSection } from './subqueries';
import { ctesSection } from './ctes';
import { setOperationsSection } from './set-operations';
import { dataModificationSection } from './data-modification';
import { commonCalculationsSection } from './common-calculations';
import { assessmentPatternsSection } from './assessment-patterns';
import { proTipsSection } from './pro-tips';
import { performanceTipsSection } from './performance-tips';

// All cheat sheet sections in order
export const cheatSheetSections = [
  executionOrderSection,
  basicsSection,
  filteringSection,
  joinsSection,
  aggregatesSection,
  windowFunctionsSection,
  dateFunctionsSection,
  stringFunctionsSection,
  mathFunctionsSection,
  conditionalLogicSection,
  subqueriesSection,
  ctesSection,
  setOperationsSection,
  dataModificationSection,
  commonCalculationsSection,
  assessmentPatternsSection,
  proTipsSection,
  performanceTipsSection
];

// Export individual sections for direct access if needed
export {
  executionOrderSection,
  basicsSection,
  filteringSection,
  joinsSection,
  aggregatesSection,
  windowFunctionsSection,
  dateFunctionsSection,
  stringFunctionsSection,
  mathFunctionsSection,
  conditionalLogicSection,
  subqueriesSection,
  ctesSection,
  setOperationsSection,
  dataModificationSection,
  commonCalculationsSection,
  assessmentPatternsSection,
  proTipsSection,
  performanceTipsSection
};

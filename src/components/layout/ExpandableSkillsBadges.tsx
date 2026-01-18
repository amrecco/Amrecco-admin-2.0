'use client';

import { useState } from 'react';

interface ExpandableSkillsBadgesProps {
  skills: string[];
  maxInitialSkills?: number;
}

const ExpandableSkillsBadges: React.FC<ExpandableSkillsBadgesProps> = ({ skills, maxInitialSkills = 4 }) => {
  const [showAll, setShowAll] = useState(false);
  
  if (skills.length <= maxInitialSkills) {
    // If at or under the limit, show all
    return (
      <div className="flex flex-wrap gap-2">
        {skills.map((skill, index) => (
          <span
            key={index}
            className="px-3 py-1.5 bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 text-xs font-bold rounded-full border border-blue-300/50 shadow-sm"
          >
            {skill}
          </span>
        ))}
      </div>
    );
  }
  
  // If more than the limit, show with expand/collapse
  const visibleSkills = showAll ? skills : skills.slice(0, maxInitialSkills);
  const hiddenCount = skills.length - maxInitialSkills;
  
  return (
    <div className="flex flex-wrap gap-2">
      {visibleSkills.map((skill, index) => (
        <span
          key={index}
          className="px-3 py-1.5 bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 text-xs font-bold rounded-full border border-blue-300/50 shadow-sm"
        >
          {skill}
        </span>
      ))}
      <button
        onClick={() => setShowAll(!showAll)}
        className="px-3 py-1.5 bg-gradient-to-r from-slate-100 to-slate-200 text-slate-600 text-xs font-bold rounded-full border border-slate-300/50 shadow-sm hover:from-slate-200 hover:to-slate-300 transition-all cursor-pointer"
      >
        {showAll 
          ? 'Show Less' 
          : `+${hiddenCount} More`
        }
      </button>
    </div>
  );
};

export default ExpandableSkillsBadges;

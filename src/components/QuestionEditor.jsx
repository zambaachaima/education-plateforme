// src/components/QuestionEditor.jsx
import { useState } from "react";

/**
 * Props:
 * - question: { id, text, choices, correctAnswerIndex, explanation }
 * - onChange(updatedQuestion)
 * - onRemove()
 */
export default function QuestionEditor({ question, onChange, onRemove }) {
  const [local, setLocal] = useState({
    id: question.id || null,
    text: question.text || "",
    choices: question.choices && question.choices.length ? question.choices : ["", "", ""],
    correctAnswerIndex: typeof question.correctAnswerIndex === "number" ? question.correctAnswerIndex : 0,
    explanation: question.explanation || ""
  });

  const update = (patch) => {
    const next = { ...local, ...patch };
    setLocal(next);
    onChange && onChange(next);
  };

  const setChoice = (idx, value) => {
    const choices = [...local.choices];
    choices[idx] = value;
    update({ choices });
  };

  const addChoice = () => update({ choices: [...local.choices, ""] });
  const removeChoice = (idx) => {
    const choices = local.choices.filter((_, i) => i !== idx);
    let cai = local.correctAnswerIndex;
    if (idx < cai) cai = cai - 1;
    if (cai >= choices.length) cai = 0;
    update({ choices, correctAnswerIndex: cai });
  };

  return (
    <div className="p-3 border rounded mb-3 bg-white">
      <div className="mb-2">
        <label className="block text-sm font-medium">Question</label>
        <input className="w-full border p-2 rounded" value={local.text} onChange={e => update({ text: e.target.value })} />
      </div>

      <div className="mb-2">
        <label className="block text-sm font-medium">Choix</label>
        {local.choices.map((c, i) => (
          <div key={i} className="flex gap-2 items-center mb-1">
            <input type="radio" name={`correct-${local.id}`} checked={local.correctAnswerIndex === i} onChange={() => update({ correctAnswerIndex: i })} />
            <input className="flex-1 border p-2 rounded" value={c} onChange={e => setChoice(i, e.target.value)} />
            {local.choices.length > 2 && <button type="button" onClick={() => removeChoice(i)} className="px-2 py-1 bg-red-500 text-white rounded">-</button>}
          </div>
        ))}
        <div>
          <button type="button" onClick={addChoice} className="px-2 py-1 bg-green-500 text-white rounded">Ajouter un choix</button>
        </div>
      </div>

      <div className="mb-2">
        <label className="block text-sm font-medium">Explication (optionnel)</label>
        <input className="w-full border p-2 rounded" value={local.explanation} onChange={e => update({ explanation: e.target.value })} />
      </div>

      <div className="flex justify-end gap-2">
        <button type="button" onClick={onRemove} className="px-3 py-1 bg-red-500 text-white rounded">Supprimer</button>
      </div>
    </div>
  );
}

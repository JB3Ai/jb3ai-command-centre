import React, { useState } from 'react';
import { Template, TemplateCategory, TemplateTone } from '../../types/outbound';
import { 
  FileText, 
  Plus, 
  Code, 
  Eye, 
  Sparkles, 
  Edit3, 
  Trash2, 
  Check, 
  Tag, 
  Sliders 
} from 'lucide-react';

interface TemplateManagerProps {
  templates: Template[];
  onSaveTemplate: (template: Template) => void;
  onDeleteTemplate: (templateId: string) => void;
}

export const TemplateManager: React.FC<TemplateManagerProps> = ({
  templates,
  onSaveTemplate,
  onDeleteTemplate,
}) => {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    templates.length > 0 ? templates[0].id : ''
  );
  const [previewMode, setPreviewMode] = useState<'editor' | 'preview'>('editor');

  const activeTemplate = templates.find((t) => t.id === selectedTemplateId) || templates[0];

  // Editor Local State
  const [name, setName] = useState(activeTemplate?.name || '');
  const [subject, setSubject] = useState(activeTemplate?.subject_line || '');
  const [bodyText, setBodyText] = useState(activeTemplate?.body_text || '');
  const [bodyHtml, setBodyHtml] = useState(activeTemplate?.body_html || '');
  const [category, setCategory] = useState<TemplateCategory>(activeTemplate?.category || 'initial-outreach');
  const [tone, setTone] = useState<TemplateTone>(activeTemplate?.tone || 'warm');

  const handleSelectTemplate = (tpl: Template) => {
    setSelectedTemplateId(tpl.id);
    setName(tpl.name);
    setSubject(tpl.subject_line);
    setBodyText(tpl.body_text);
    setBodyHtml(tpl.body_html);
    setCategory(tpl.category);
    setTone(tpl.tone);
  };

  const handleInsertVariable = (varName: string) => {
    setBodyText((prev) => prev + ` ${varName}`);
    setBodyHtml((prev) => prev + ` ${varName}`);
  };

  const handleCreateNew = () => {
    const newId = `t_${Date.now()}`;
    const newTpl: Template = {
      id: newId,
      name: 'New Outreach Template',
      subject_line: 'Isikolo AI Partnership with {{company}}',
      body_text: 'Hi {{first_name}},\n\nReaching out regarding Isikolo AI...',
      body_html: '<p>Hi <strong>{{first_name}}</strong>,</p><p>Reaching out regarding Isikolo AI...</p>',
      category: 'initial-outreach',
      variables: ['{{first_name}}', '{{company}}', '{{program}}'],
      tone: 'warm',
    };
    onSaveTemplate(newTpl);
    handleSelectTemplate(newTpl);
  };

  const handleSaveChanges = () => {
    if (!activeTemplate) return;
    const updated: Template = {
      ...activeTemplate,
      name,
      subject_line: subject,
      body_text: bodyText,
      body_html: bodyHtml,
      category,
      tone,
    };
    onSaveTemplate(updated);
  };

  // Variable Sample Replacement for Live Preview
  const renderLivePreview = () => {
    let replaced = bodyHtml || bodyText;
    replaced = replaced
      .replace(/{{first_name}}/g, 'Sarah')
      .replace(/{{company}}/g, 'Microsoft')
      .replace(/{{program}}/g, 'Microsoft FOSS Fund')
      .replace(/{{days_since_sent}}/g, '3')
      .replace(/{{my_calendly_link}}/g, 'https://calendly.com/sponsor-jb3ai/15min')
      .replace(/{{custom_snippet}}/g, 'We saw Microsoft\'s recent open-source AI grant announcement and believe Isikolo fits your vision.');

    return (
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 text-slate-100 font-sans space-y-4">
        <div className="border-b border-slate-800 pb-3">
          <div className="text-xs text-slate-400">Subject Preview:</div>
          <h3 className="font-bold text-sm text-indigo-300">
            {subject
              .replace(/{{first_name}}/g, 'Sarah')
              .replace(/{{company}}/g, 'Microsoft')
              .replace(/{{program}}/g, 'Microsoft FOSS Fund')}
          </h3>
        </div>
        <div
          className="prose prose-invert prose-sm text-slate-200 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: replaced }}
        />
      </div>
    );
  };

  return (
    <div className="flex-1 flex h-[calc(100vh-4rem)] bg-slate-950 text-slate-100 overflow-hidden">
      {/* Left Templates Navigation List */}
      <div className="w-80 border-r border-slate-800 bg-slate-900/50 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-400" />
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-200">
              Template Library
            </h3>
          </div>
          <button
            onClick={handleCreateNew}
            className="p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-sm transition-all"
            title="Create New Template"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
          {templates.map((tpl) => {
            const isSelected = tpl.id === activeTemplate?.id;
            return (
              <div
                key={tpl.id}
                onClick={() => handleSelectTemplate(tpl)}
                className={`p-3.5 cursor-pointer transition-all ${
                  isSelected ? 'bg-indigo-950/40 border-l-4 border-indigo-500' : 'hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-bold text-xs text-slate-100 truncate">{tpl.name}</h4>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-slate-800 text-slate-400">
                    {tpl.category}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 truncate font-mono">{tpl.subject_line}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Template Editor & Preview */}
      {activeTemplate && (
        <div className="flex-1 flex flex-col bg-slate-950 overflow-y-auto">
          {/* Header Bar */}
          <div className="p-4 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="font-bold text-base bg-transparent border-b border-slate-700 text-white focus:outline-none focus:border-indigo-500 px-1"
              />
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                {tone}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
                <button
                  onClick={() => setPreviewMode('editor')}
                  className={`px-3 py-1 rounded-md font-semibold transition-all ${
                    previewMode === 'editor' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Editor
                </button>
                <button
                  onClick={() => setPreviewMode('preview')}
                  className={`px-3 py-1 rounded-md font-semibold transition-all ${
                    previewMode === 'preview' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Live Preview
                </button>
              </div>

              <button
                onClick={handleSaveChanges}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save</span>
              </button>
            </div>
          </div>

          {/* Editor Body */}
          <div className="p-6 flex-1 space-y-4">
            {previewMode === 'preview' ? (
              renderLivePreview()
            ) : (
              <>
                {/* Subject Line & Controls */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-slate-400 mb-1">
                      Subject Line (Supports Variables)
                    </label>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as TemplateCategory)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="initial-outreach">Initial Outreach</option>
                      <option value="follow-up">Follow-Up</option>
                      <option value="reply-template">Reply Template</option>
                      <option value="pitch">Pitch / Event</option>
                    </select>
                  </div>
                </div>

                {/* Variable Injection Buttons */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 mb-2 text-xs text-slate-400 font-semibold">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Quick Inject Mustache Variable:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      '{{first_name}}',
                      '{{company}}',
                      '{{program}}',
                      '{{days_since_sent}}',
                      '{{my_calendly_link}}',
                      '{{custom_snippet}}',
                    ].map((varName) => (
                      <button
                        key={varName}
                        onClick={() => handleInsertVariable(varName)}
                        className="px-2.5 py-1 bg-slate-950 hover:bg-indigo-950 text-indigo-300 border border-slate-800 rounded-lg text-xs font-mono transition-all"
                      >
                        + {varName}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Plain Text & HTML Textarea */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Email Body Content (Markdown / Text / HTML)
                  </label>
                  <textarea
                    rows={12}
                    value={bodyText}
                    onChange={(e) => {
                      setBodyText(e.target.value);
                      setBodyHtml(
                        e.target.value
                          .replace(/\n\n/g, '</p><p>')
                          .replace(/\n/g, '<br>')
                      );
                    }}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500 leading-relaxed"
                  />
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

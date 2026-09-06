'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { templatesApi } from '@/lib/api';
import DynamicForm from '@/components/dynamic-form/DynamicForm';

export default function TemplateManagerPage() {
  const { user, activeRole } = useAuth();
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Edit State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [jsonText, setJsonText] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [parsedSchema, setParsedSchema] = useState<any>(null);

  // Preview Role Selector (lets doctors preview how other roles see the form!)
  const [previewRole, setPreviewRole] = useState<string>('doctor');

  useEffect(() => {
    // Check access
    if (activeRole !== 'doctor' && activeRole !== 'admin') {
      setIsLoading(false);
      return;
    }

    templatesApi.list()
      .then((res: any) => {
        setTemplates(res);
        if (res.length > 0) {
          handleSelectTemplate(res[0]);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [activeRole]);

  const handleSelectTemplate = (temp: any) => {
    setSelectedTemplate(temp);
    setTitle(temp.title);
    setDescription(temp.description || '');
    const schemaStr = JSON.stringify(temp.schema_json, null, 2);
    setJsonText(schemaStr);
    setParsedSchema(temp.schema_json);
    setJsonError(null);
  };

  const handleJsonChange = (text: string) => {
    setJsonText(text);
    try {
      const parsed = JSON.parse(text);
      if (!parsed.sections || !Array.isArray(parsed.sections)) {
        setJsonError('Schema validation error: Root object must contain a "sections" array.');
        return;
      }
      setParsedSchema(parsed);
      setJsonError(null);
    } catch (e: any) {
      setJsonError(`JSON Syntax Error: ${e.message}`);
    }
  };

  const handleSaveTemplate = async () => {
    if (jsonError || !selectedTemplate || !user) return;
    setIsSaving(true);
    try {
      const updated: any = await templatesApi.update(selectedTemplate.id, {
        title,
        description,
        schema_json: parsedSchema
      });
      // Update template in list
      setTemplates((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      setSelectedTemplate(updated);
      alert('Template schema saved and published successfully!');
    } catch (e) {
      alert('Failed to save template. Please check JSON syntax.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateNewTemplate = async () => {
    if (!user) return;
    const name = prompt('Enter a unique record type key (e.g. custom_consultation_notes):');
    if (!name) return;
    
    // Create base schema
    const newSchema = {
      plugin_id: 'fertility',
      record_type: name,
      schema_version: '1.0',
      title: 'New Clinical Template',
      description: 'Custom notes and clinical record inputs.',
      sections: [
        {
          id: 'chief_complaints_sec',
          title: 'Section 1',
          fields: [
            {
              id: 'custom_notes_field',
              label: 'Notes Description',
              type: 'textarea',
              required: false,
              role_access: ['doctor', 'nurse', 'admin']
            }
          ]
        }
      ]
    };

    try {
      const created = await templatesApi.create({
        plugin_id: 'fertility',
        record_type: name,
        title: 'New Clinical Template',
        description: 'Custom notes and clinical record inputs.',
        schema_json: newSchema,
        created_by: user.id
      });
      setTemplates([...templates, created]);
      handleSelectTemplate(created);
    } catch (e) {
      alert('Failed to create new template. Ensure the key is unique.');
    }
  };

  if (user && user.role !== 'admin') {
    return (
      <div className="p-16 text-center max-w-md mx-auto space-y-4">
        <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center text-3xl mx-auto border border-rose-100 shadow-sm">
          🔒
        </div>
        <h2 className="text-xl font-black text-slate-900">Access Restricted</h2>
        <p className="text-xs text-slate-500">
          Template configuration and schema editing are restricted to Administrator accounts.
        </p>
        <a
          href="/dashboard"
          className="inline-block px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors"
        >
          ← Return to Dashboard
        </a>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full px-3 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">⚙️ Template Manager</h1>
          <p className="text-slate-500 text-sm mt-1">Customize dynamic clinical form schemas with live sandbox validation</p>
        </div>
        <button
          onClick={handleCreateNewTemplate}
          className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-md transition-colors self-start md:self-auto"
        >
          + Create Custom Template
        </button>
      </div>

      {/* Workspace split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* LEFT: Schema Editor */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[600px]">
          {/* Header */}
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm">Select & Edit Template</h3>
              <button
                onClick={handleSaveTemplate}
                disabled={isSaving || !!jsonError}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl shadow-sm transition-colors"
              >
                {isSaving ? 'Publishing...' : '💾 Save & Publish'}
              </button>
            </div>
            
            <select
              value={selectedTemplate?.id || ''}
              onChange={(e) => {
                const found = templates.find((t) => t.id === e.target.value);
                if (found) handleSelectTemplate(found);
              }}
              className="vmd-input appearance-none pr-8 cursor-pointer bg-white"
            >
              {templates.map((t) => (
                <option key={t.id} value={t.id}>{t.title} ({t.record_type})</option>
              ))}
            </select>
          </div>

          {/* Form Properties & JSON text */}
          <div className="p-5 flex-1 flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Template Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="vmd-input text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="vmd-input text-xs"
                />
              </div>
            </div>

            <div className="flex-1 flex flex-col min-h-[350px]">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Schema JSON Configuration</label>
              <textarea
                value={jsonText}
                onChange={(e) => handleJsonChange(e.target.value)}
                className="flex-1 w-full bg-slate-900 text-slate-100 font-mono text-[11px] leading-relaxed p-4 rounded-xl resize-none focus:outline-none focus:ring-1 focus:ring-indigo-500 overflow-y-auto"
                style={{ tabSize: 2 }}
              />
            </div>

            {/* Error messaging */}
            {jsonError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-3 rounded-xl font-mono leading-normal">
                ⚠️ {jsonError}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Live Preview Sandbox */}
        <div className="lg:col-span-7 bg-slate-100 border border-slate-200 rounded-2xl p-6 flex flex-col gap-6 min-h-[600px] overflow-y-auto shadow-inner relative">
          
          {/* Top Preview Bar */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-4 flex-shrink-0">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Live Sandbox Preview</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Interact with the dynamically rendered form in real-time</p>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Preview Role:</span>
              <select
                value={previewRole}
                onChange={(e) => setPreviewRole(e.target.value)}
                className="vmd-input w-auto text-xs py-1 px-3 bg-white"
              >
                <option value="doctor">👩‍⚕️ Doctor View</option>
                <option value="nurse">🧑‍⚕️ Nurse View</option>
                <option value="receptionist">👨‍💼 Receptionist View</option>
              </select>
            </div>
          </div>

          {/* Render Preview */}
          <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            {parsedSchema ? (
              <div className="space-y-6">
                <div>
                  <h2 className="font-black text-slate-800 text-lg">{parsedSchema.title || title}</h2>
                  <p className="text-slate-500 text-xs mt-0.5">{parsedSchema.description || description}</p>
                </div>
                
                <DynamicForm
                  key={`${selectedTemplate?.id}-${previewRole}-${jsonText.length}`}
                  schema={parsedSchema}
                  userRole={previewRole}
                  onSave={async (data) => {
                    alert(`Sandbox Submit Triggered!\nPayload Data:\n${JSON.stringify(data, null, 2)}`);
                  }}
                  isSaving={false}
                />
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 italic text-sm py-12">
                Fix JSON syntax errors to enable preview rendering...
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

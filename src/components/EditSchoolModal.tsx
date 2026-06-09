/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { SaaS_School } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  School, 
  Mail, 
  MapPin, 
  Phone, 
  Hash, 
  Globe, 
  Building, 
  ToggleLeft, 
  ToggleRight, 
  AlertTriangle, 
  CheckCircle, 
  Image as ImageIcon 
} from 'lucide-react';

interface EditSchoolModalProps {
  isOpen: boolean;
  onClose: () => void;
  school: SaaS_School | null;
  onSave: (updatedSchool: SaaS_School) => void;
  lang: 'en' | 'sw';
  isDarkMode: boolean;
}

export default function EditSchoolModal({
  isOpen,
  onClose,
  school,
  onSave,
  lang,
  isDarkMode
}: EditSchoolModalProps) {
  // Localization references
  const t = {
    en: {
      modalTitle: "Adjust School Governance & Parameters",
      editDetails: "Edit School Details",
      schoolName: "School Campus Name *",
      email: "Fiscal Email Address *",
      address: "Physical Street Address *",
      level: "Institutional Level",
      regNum: "Registration Identifier *",
      region: "Region *",
      district: "District *",
      ward: "Ward *",
      phone: "Phone Line Contact *",
      logoUrl: "Simulate Logo Vector URL Badge",
      modelPreset: "Model Preset",
      accountStatus: "Account Access Gate",
      accountSuspended: "Account Suspended",
      accountActive: "Account Active & Verified",
      suspendWarning: "Suspended schools cannot access teacher registers or GPS clock-ins.",
      activeInfo: "The institutional node has active clearance and API privileges.",
      saveChanges: "Save Changes",
      cancel: "Cancel",
      mandatoryError: "All fields marked with * are strictly mandatory.",
      invalidEmail: "Please provide a valid fiscal email address.",
    },
    sw: {
      modalTitle: "Marekebisho ya Utawala na Shule",
      editDetails: "Hariri Maelezo ya Shule",
      schoolName: "Jina la Shule *",
      email: "Barua Pepe ya Wasifu *",
      address: "Anwani ya Eneo (Mtaa) *",
      level: "Kiwango cha Masomo",
      regNum: "Namba ya Usajili *",
      region: "Mkoa *",
      district: "Wilaya *",
      ward: "Kata *",
      phone: "Namba ya Simu *",
      logoUrl: "Anwani Kuu ya Alama ya Shule (Logo URL)",
      modelPreset: "Mfano",
      accountStatus: "Hali ya Ufikiaji ya Akaunti",
      accountSuspended: "Akaunti Imesitishwa",
      accountActive: "Akaunti Iko Amilifu",
      suspendWarning: "Shule zilizositishwa haziwezi kuona mahudhurio au kusajili GPS.",
      activeInfo: "Kituo hiki kina ufikiaji kamili na haki zote za jukwaa letu.",
      saveChanges: "Hifadhi Mabadiliko",
      cancel: "Ghairi",
      mandatoryError: "Tafadhali jaza maelezo yote yenye alama ya *.",
      invalidEmail: "Tafadhali weka barua pepe sahihi.",
    }
  }[lang];

  // Forms Fields states
  const [schName, setSchName] = useState('');
  const [schType, setSchType] = useState('Secondary');
  const [schCategory, setSchCategory] = useState<'Private' | 'Government'>('Private');
  const [schRegNum, setSchRegNum] = useState('');
  const [schRegion, setSchRegion] = useState('Arusha');
  const [schDistrict, setSchDistrict] = useState('');
  const [schWard, setSchWard] = useState('');
  const [schAddress, setSchAddress] = useState('');
  const [schEmail, setSchEmail] = useState('');
  const [schPhone, setSchPhone] = useState('');
  const [schLogo, setSchLogo] = useState('');
  const [schStatus, setSchStatus] = useState<'ACTIVE' | 'SUSPENDED'>('ACTIVE');
  const [validationError, setValidationError] = useState('');

  // Sync inputs to school prop
  useEffect(() => {
    if (school) {
      setSchName(school.name || '');
      setSchType(school.type || 'Secondary');
      setSchCategory(school.category || 'Private');
      setSchRegNum(school.registrationNumber || '');
      setSchRegion(school.region || 'Arusha');
      setSchDistrict(school.district || '');
      setSchWard(school.ward || '');
      setSchAddress(school.address || '');
      setSchEmail(school.email || '');
      setSchPhone(school.phone || '');
      setSchLogo(school.logoUrl || '');
      setSchStatus(school.status || 'ACTIVE');
      setValidationError('');
    }
  }, [school, isOpen]);

  if (!isOpen || !school) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Field Validations
    if (!schName.trim() || !schRegNum.trim() || !schEmail.trim() || !schPhone.trim() || !schAddress.trim()) {
      setValidationError(t.mandatoryError);
      return;
    }

    if (!schEmail.includes('@') || !schEmail.includes('.')) {
      setValidationError(t.invalidEmail);
      return;
    }

    // Build modern updated school resource
    const updated: SaaS_School = {
      ...school,
      name: schName.trim(),
      type: schType,
      category: schCategory,
      registrationNumber: schRegNum.trim(),
      region: schRegion,
      district: schDistrict.trim(),
      ward: schWard.trim(),
      address: schAddress.trim(),
      email: schEmail.trim(),
      phone: schPhone.trim(),
      logoUrl: schLogo.trim() || 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&q=80&w=200',
      status: schStatus,
    };

    onSave(updated);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-xs">
        {/* Backdrop overlay trigger dismiss */}
        <div className="absolute inset-0" onClick={onClose} />

        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'tween', duration: 0.3 }}
          className={`relative z-10 w-full max-w-lg h-full overflow-y-auto flex flex-col justify-between shadow-2xl border-l ${
            isDarkMode 
              ? 'bg-slate-900 border-slate-800 text-slate-100' 
              : 'bg-white border-slate-200 text-slate-800'
          }`}
          id="edit-school-modal-slide"
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-500/5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-orange-600 text-white rounded-2xl shadow-md">
                <School className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold uppercase text-orange-500 tracking-widest">{t.editDetails}</span>
                <h3 className="font-extrabold text-sm md:text-base leading-tight tracking-tight mt-0.5">
                  {t.modalTitle}
                </h3>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 px-2 hover:bg-slate-500/10 rounded-full cursor-pointer text-slate-400 hover:text-slate-200 transition-colors"
              id="edit-school-modal-close"
              title="Close Panel"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-6 flex-grow space-y-4 text-xs" id="school-param-edit-form">
            {validationError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl font-semibold flex items-center gap-2">
                <AlertTriangle className="h-4.5 w-4.5 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            {/* School Name */}
            <div>
              <label className="block text-xxs font-extrabold uppercase text-slate-400 mb-1 flex items-center gap-1">
                <Building className="h-3 w-3" />
                <span>{t.schoolName}</span>
              </label>
              <input 
                type="text" 
                required
                placeholder="e.g. Arusha Tech Science Academy"
                value={schName}
                onChange={e => setSchName(e.target.value)}
                className="w-full p-2.5 bg-transparent border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-orange-500/30 font-medium"
                id="edit-sch-name"
              />
            </div>

            {/* Level, Category and Reg ID */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xxs font-extrabold uppercase text-slate-400 mb-1 flex items-center gap-1">
                  <Hash className="h-3 w-3" />
                  <span>Institutional Level</span>
                </label>
                <select 
                  value={schType}
                  onChange={e => setSchType(e.target.value)}
                  className="w-full p-2.5 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
                  id="edit-sch-level"
                >
                  <option value="Primary">Primary School (Msingi)</option>
                  <option value="Secondary">Secondary School (Sekondari)</option>
                  <option value="Combined">Combined Primary & Secondary (Mseto)</option>
                </select>
              </div>

              <div>
                <label className="block text-xxs font-extrabold uppercase text-slate-400 mb-1 flex items-center gap-1">
                  <Hash className="h-3 w-3" />
                  <span>Regulatory Category</span>
                </label>
                <select 
                  value={schCategory}
                  onChange={e => setSchCategory(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
                  id="edit-sch-category"
                >
                  <option value="Private">Private School (Binafsi)</option>
                  <option value="Government">Government School (Serikali)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xxs font-extrabold uppercase text-slate-400 mb-1 flex items-center gap-1">
                <Hash className="h-3 w-3" />
                <span>{t.regNum}</span>
              </label>
              <input 
                type="text" 
                required
                placeholder="e.g. REG-TZ-10091"
                value={schRegNum}
                onChange={e => setSchRegNum(e.target.value)}
                className="w-full p-2.5 bg-transparent border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-orange-500/30 font-mono font-medium"
                id="edit-sch-regnum"
              />
            </div>

            {/* Region, District, Ward */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xxs font-extrabold uppercase text-slate-400 mb-1 flex items-center gap-1">
                  <Globe className="h-3 w-3" />
                  <span>{t.region}</span>
                </label>
                <select 
                  value={schRegion}
                  onChange={e => setSchRegion(e.target.value)}
                  className="w-full p-2 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
                  id="edit-sch-region"
                >
                  <option value="Arusha">Arusha</option>
                  <option value="Dar es Salaam">Dar es Salaam</option>
                  <option value="Dodoma">Dodoma</option>
                  <option value="Kilimanjaro">Kilimanjaro</option>
                  <option value="Mwanza">Mwanza</option>
                  <option value="Tanga">Tanga</option>
                </select>
              </div>

              <div>
                <label className="block text-xxs font-extrabold uppercase text-slate-400 mb-1">
                  {t.district}
                </label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Meru"
                  value={schDistrict}
                  onChange={e => setSchDistrict(e.target.value)}
                  className="w-full p-2 bg-transparent border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-orange-500/30 text-xs font-medium"
                  id="edit-sch-district"
                />
              </div>

              <div>
                <label className="block text-xxs font-extrabold uppercase text-slate-400 mb-1">
                  {t.ward}
                </label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Usa River"
                  value={schWard}
                  onChange={e => setSchWard(e.target.value)}
                  className="w-full p-2 bg-transparent border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-orange-500/30 text-xs font-medium"
                  id="edit-sch-ward"
                />
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="block text-xxs font-extrabold uppercase text-slate-400 mb-1 flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                <span>{t.address}</span>
              </label>
              <input 
                type="text" 
                required
                placeholder="e.g. Arusha Science Rd, Plot 4"
                value={schAddress}
                onChange={e => setSchAddress(e.target.value)}
                className="w-full p-2.5 bg-transparent border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-orange-500/30 font-medium"
                id="edit-sch-address"
              />
            </div>

            {/* Email and Phone */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xxs font-extrabold uppercase text-slate-400 mb-1 flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  <span>{t.email}</span>
                </label>
                <input 
                  type="email" 
                  required
                  placeholder="info@arushascience.ac.tz"
                  value={schEmail}
                  onChange={e => setSchEmail(e.target.value)}
                  className="w-full p-2.5 bg-transparent border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-orange-500/30 font-medium"
                  id="edit-sch-email"
                />
              </div>

              <div>
                <label className="block text-xxs font-extrabold uppercase text-slate-400 mb-1 flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  <span>{t.phone}</span>
                </label>
                <input 
                  type="tel" 
                  required
                  placeholder="0755112233"
                  value={schPhone}
                  onChange={e => setSchPhone(e.target.value)}
                  className="w-full p-2.5 bg-transparent border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-orange-500/30 font-mono font-medium"
                  id="edit-sch-phone"
                />
              </div>
            </div>

            {/* Logo Badge URL Preset options */}
            <div>
              <label className="block text-xxs font-extrabold uppercase text-slate-400 mb-1 flex items-center gap-1">
                <ImageIcon className="h-3 w-3" />
                <span>{t.logoUrl}</span>
              </label>
              <input 
                type="url" 
                placeholder="e.g. https://images.unsplash.com/photo-..."
                value={schLogo}
                onChange={e => setSchLogo(e.target.value)}
                className="w-full p-2.5 bg-transparent border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-orange-500/30 font-mono text-slate-400"
                id="edit-sch-logo"
              />
              <div className="flex gap-2 mt-2">
                <button 
                  type="button" 
                  onClick={() => setSchLogo('https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&q=80&w=200')}
                  className="p-1 px-2 border border-slate-205 dark:border-slate-800 hover:bg-slate-500/10 rounded cursor-pointer text-[10px] font-bold"
                >
                  {t.modelPreset} 1
                </button>
                <button 
                  type="button" 
                  onClick={() => setSchLogo('https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&q=80&w=200')}
                  className="p-1 px-2 border border-slate-205 dark:border-slate-800 hover:bg-slate-500/10 rounded cursor-pointer text-[10px] font-bold"
                >
                  {t.modelPreset} 2
                </button>
              </div>
            </div>

            {/* Toggle for Account Suspension */}
            <div className="pt-4 border-t border-slate-150 dark:border-slate-805">
              <label className="block text-xxs font-extrabold uppercase text-slate-405 mb-2">
                {t.accountStatus}
              </label>

              <div className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${
                schStatus === 'SUSPENDED' 
                  ? 'bg-red-500/5 border-red-500/20' 
                  : 'bg-emerald-500/5 border-emerald-500/20'
              }`}>
                <div className="space-y-1 pr-4">
                  <span className={`text-xs font-black block uppercase ${
                    schStatus === 'SUSPENDED' ? 'text-red-500' : 'text-emerald-555 animate-pulse'
                  }`}>
                    {schStatus === 'SUSPENDED' ? t.accountSuspended : t.accountActive}
                  </span>
                  <span className="text-[10px] text-slate-400 block leading-tight">
                    {schStatus === 'SUSPENDED' ? t.suspendWarning : t.activeInfo}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setSchStatus(schStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE')}
                  className="focus:outline-hidden cursor-pointer"
                  id="suspension-toggle"
                  title="Toggle Account Suspension Status"
                >
                  {schStatus === 'SUSPENDED' ? (
                    <ToggleLeft className="h-9 w-9 text-red-500" />
                  ) : (
                    <ToggleRight className="h-9 w-9 text-emerald-500" />
                  )}
                </button>
              </div>
            </div>
          </form>

          {/* Sticky Actions Footer */}
          <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3 bg-slate-500/5 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 hover:bg-slate-500/10 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-black cursor-pointer text-center"
              id="edit-school-cancel"
            >
              {t.cancel}
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="flex-1 py-2.5 bg-orange-650 hover:bg-orange-700 text-white rounded-xl text-xs font-black cursor-pointer text-center shadow-md shadow-orange-500/10"
              id="edit-school-save"
            >
              {t.saveChanges}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

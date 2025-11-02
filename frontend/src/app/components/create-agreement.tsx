// src/app/agreement/create/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Menu from '@/app/components/menu';
import Footer from '@/app/components/footer';
import Swal from 'sweetalert2';
import { 
  ArrowLeft, 
  FileText, 
  User, 
  Plus, 
  X, 
  Clock,
  Calendar,
  MapPin,
  Target,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface User {
  userId: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
}

interface SkillItem {
  id: string;
  skillName: string;
  skillDescription: string;
  deliverables: string[];
  duration: string; // e.g., "2 weeks", "1 month", "3 sessions"
  timeCommitment: string; // e.g., "5 hours per week"
  startDate: string;
  completionCriteria: string;
}

interface AgreementForm {
  otherUser: string;
  agreementTitle: string;
  agreementType: 'skill_swap' | 'service_exchange' | 'mentorship';
  skills: SkillItem[];
  terms: string;
  meetingLocation: string;
  communicationMethod: string;
  disputeResolution: string;
  confidentiality: boolean;
  terminationClause: string;
  specialConditions: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function CreateAgreementPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const otherUserParam = searchParams.get('otherUser');
  
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<AgreementForm>({
    otherUser: otherUserParam || '',
    agreementTitle: '',
    agreementType: 'skill_swap',
    skills: [
      {
        id: '1',
        skillName: '',
        skillDescription: '',
        deliverables: [''],
        duration: '',
        timeCommitment: '',
        startDate: '',
        completionCriteria: ''
      }
    ],
    terms: '',
    meetingLocation: 'Online',
    communicationMethod: 'Platform messaging',
    disputeResolution: 'Parties agree to resolve disputes through mutual discussion and mediation',
    confidentiality: true,
    terminationClause: 'Either party may terminate this agreement with 7 days written notice',
    specialConditions: ''
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          setUser(userData);
        } else {
          router.push('/login');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [router]);

  const handleInputChange = (field: keyof AgreementForm, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSkillChange = (index: number, field: keyof SkillItem, value: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.map((skill, i) => 
        i === index ? { ...skill, [field]: value } : skill
      )
    }));
  };

  const handleDeliverableChange = (skillIndex: number, deliverableIndex: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.map((skill, i) => 
        i === skillIndex 
          ? {
              ...skill,
              deliverables: skill.deliverables.map((deliverable, j) => 
                j === deliverableIndex ? value : deliverable
              )
            }
          : skill
      )
    }));
  };

  const addDeliverable = (skillIndex: number) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.map((skill, i) => 
        i === skillIndex 
          ? { ...skill, deliverables: [...skill.deliverables, ''] }
          : skill
      )
    }));
  };

  const removeDeliverable = (skillIndex: number, deliverableIndex: number) => {
    if (formData.skills[skillIndex].deliverables.length > 1) {
      setFormData(prev => ({
        ...prev,
        skills: prev.skills.map((skill, i) => 
          i === skillIndex 
            ? { 
                ...skill, 
                deliverables: skill.deliverables.filter((_, j) => j !== deliverableIndex) 
              }
            : skill
        )
      }));
    }
  };

  const addSkill = () => {
    setFormData(prev => ({
      ...prev,
      skills: [
        ...prev.skills,
        {
          id: Date.now().toString(),
          skillName: '',
          skillDescription: '',
          deliverables: [''],
          duration: '',
          timeCommitment: '',
          startDate: '',
          completionCriteria: ''
        }
      ]
    }));
  };

  const removeSkill = (index: number) => {
    if (formData.skills.length > 1) {
      setFormData(prev => ({
        ...prev,
        skills: prev.skills.filter((_, i) => i !== index)
      }));
    }
  };

  const validateForm = (): boolean => {
    if (!formData.otherUser.trim()) {
      Swal.fire({
        icon: 'error',
        title: 'Oops!',
        text: 'Please enter the username of the person you want to swap skills with'
      })
      return false;
    }

    if (!formData.agreementTitle.trim()) {
      Swal.fire({
        icon: 'error',
        title: 'Oops!',
        text: 'Please enter an agreement title'
      })
      return false;
    }

    if (formData.skills.some(skill => !skill.skillName.trim())) {
      Swal.fire({
        icon: 'error',
        title: 'Oops!',
        text: 'Please enter a skill name for all skill exchanges'
      })
      return false;
    }

    if (formData.skills.some(skill => !skill.skillDescription.trim())) {
     
      Swal.fire({
        icon: 'error',
        title: 'Oops!',
        text: 'Please enter a description for all skills'
      })
      return false;
    }

    if (formData.skills.some(skill => skill.deliverables.some(d => !d.trim()))) {
      Swal.fire({
        icon: 'error',
        title: 'Oops!',
        text: 'Please fill in all deliverables'
      })
      return false;
    }

    if (!formData.terms.trim()) {
      Swal.fire({
        icon: 'error',
        title: 'Oops!',
        text: 'Please specify the terms of the agreement'
      })
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/agreements/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fromUser: user?.username,
          toUser: formData.otherUser,
          agreementData: formData
        }),
      });

      const data = await response.json();

      if (data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'Skill swap agreement created successfully!'
        }).then(() => {
          router.push('/agreement');
        })
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Oops!',
          text: `Failed to create agreement: ${data.message}`
        })
      
      }
    } catch (error) {
      console.error('Error creating agreement:', error);
      Swal.fire({
        icon: 'error',
        title: 'Oops!',
        text: 'An error occurred while creating the agreement.'
      })
     
    } finally {
      setSubmitting(false);
    }
  };

  const skillCategories = [
    'Web Development',
    'Graphic Design',
    'Digital Marketing',
    'Content Writing',
    'Video Editing',
    'Photography',
    'UI/UX Design',
    'Data Analysis',
    'Project Management',
    'Language Tutoring',
    'Music Lessons',
    'Fitness Training',
    'Cooking Lessons',
    'Business Consulting',
    'Other'
  ];

  const durationOptions = [
    '1 week',
    '2 weeks',
    '1 month',
    '2 months',
    '3 months',
    '6 months',
    'Custom'
  ];

  const timeCommitmentOptions = [
    '1-2 hours per week',
    '3-5 hours per week',
    '5-10 hours per week',
    '10-15 hours per week',
    '15-20 hours per week',
    'Flexible schedule',
    'Project-based'
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col">
        <Menu user={user} />
        <div className="flex-grow flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Menu user={user} />
      
      <main className="flex-grow">
        {/* Breadcrumb */}
        <div className="bg-white border-b border-gray-200 py-4">
          <div className="container mx-auto px-4">
            <div className="flex items-center space-x-2 text-sm">
              <button 
                onClick={() => router.back()}
                className="flex items-center text-purple-600 hover:text-purple-700 cursor-pointer"
              >
                <ArrowLeft size={16} className="mr-1" />
                Back
              </button>
              <span className="text-gray-400">/</span>
              <button 
                onClick={() => router.push('/dashboard')}
                className="text-purple-600 hover:text-purple-700 cursor-pointer"
              >
                Dashboard
              </button>
              <span className="text-gray-400">/</span>
              <button 
                onClick={() => router.push('/agreement')}
                className="text-purple-600 hover:text-purple-700 cursor-pointer"
              >
                Agreements
              </button>
              <span className="text-gray-400">/</span>
              <span className="text-gray-600">Create Skill Swap Agreement</span>
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white py-8">
          <div className="container mx-auto px-4">
            <div className="text-center">
              <h1 className="text-3xl font-bold mb-2">Create Skill Swap Agreement</h1>
              <p className="text-purple-100">Formalize your skill exchange with clear deliverables and timelines</p>
            </div>
          </div>
        </div>

        {/* Agreement Form */}
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Basic Information Card */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
                  <FileText size={20} className="mr-2 text-purple-600" />
                  Basic Information
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Other User */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Skill Swap Partner *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                      <input
                        type="text"
                        value={formData.otherUser}
                        onChange={(e) => handleInputChange('otherUser', e.target.value)}
                        placeholder="Enter username"
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                        required
                      />
                    </div>
                  </div>

                  {/* Agreement Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Agreement Title *
                    </label>
                    <input
                      type="text"
                      value={formData.agreementTitle}
                      onChange={(e) => handleInputChange('agreementTitle', e.target.value)}
                      placeholder="e.g., Web Development for Graphic Design Swap"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                      required
                    />
                  </div>

                  {/* Agreement Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Agreement Type *
                    </label>
                    <select
                      value={formData.agreementType}
                      onChange={(e) => handleInputChange('agreementType', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                    >
                      <option value="skill_swap">Skill Swap</option>
                      <option value="service_exchange">Service Exchange</option>
                      <option value="mentorship">Mentorship Program</option>
                    </select>
                  </div>

                  {/* Communication Method */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Communication Method *
                    </label>
                    <select
                      value={formData.communicationMethod}
                      onChange={(e) => handleInputChange('communicationMethod', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                    >
                      <option value="Platform messaging">Platform messaging</option>
                      <option value="Email and scheduled calls">Email and scheduled calls</option>
                      <option value="Video calls only">Video calls only</option>
                      <option value="In-person meetings">In-person meetings</option>
                      <option value="Mixed communication">Mixed communication</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Skills Exchange Section */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                    <Target size={20} className="mr-2 text-purple-600" />
                    Skills to Exchange
                  </h2>
                  <button
                    type="button"
                    onClick={addSkill}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition duration-200 flex items-center cursor-pointer"
                  >
                    <Plus size={16} className="mr-2" />
                    Add Skill
                  </button>
                </div>

                {formData.skills.map((skill, index) => (
                  <div key={skill.id} className="border border-gray-200 rounded-lg p-6 mb-6 last:mb-0">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-gray-800">Skill Exchange {index + 1}</h3>
                      {formData.skills.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeSkill(index)}
                          className="text-red-600 hover:text-red-700 cursor-pointer"
                        >
                          <X size={20} />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      {/* Skill Name */}
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Skill/Service Name *
                        </label>
                        <select
                          value={skill.skillName}
                          onChange={(e) => handleSkillChange(index, 'skillName', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                          required
                        >
                          <option value="">Select Skill Category</option>
                          {skillCategories.map(category => (
                            <option key={category} value={category}>{category}</option>
                          ))}
                        </select>
                      </div>

                      {/* Skill Description */}
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Skill Description *
                        </label>
                        <textarea
                          value={skill.skillDescription}
                          onChange={(e) => handleSkillChange(index, 'skillDescription', e.target.value)}
                          placeholder="Describe the skill or service you're offering in detail..."
                          rows={3}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 resize-none"
                          required
                        />
                      </div>

                      {/* Duration */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Duration *
                        </label>
                        <select
                          value={skill.duration}
                          onChange={(e) => handleSkillChange(index, 'duration', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                          required
                        >
                          <option value="">Select Duration</option>
                          {durationOptions.map(duration => (
                            <option key={duration} value={duration}>{duration}</option>
                          ))}
                        </select>
                      </div>

                      {/* Time Commitment */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Time Commitment *
                        </label>
                        <select
                          value={skill.timeCommitment}
                          onChange={(e) => handleSkillChange(index, 'timeCommitment', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                          required
                        >
                          <option value="">Select Time Commitment</option>
                          {timeCommitmentOptions.map(commitment => (
                            <option key={commitment} value={commitment}>{commitment}</option>
                          ))}
                        </select>
                      </div>

                      {/* Start Date */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Expected Start Date *
                        </label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                          <input
                            type="date"
                            value={skill.startDate}
                            onChange={(e) => handleSkillChange(index, 'startDate', e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                            required
                          />
                        </div>
                      </div>

                      {/* Completion Criteria */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Completion Criteria *
                        </label>
                        <input
                          type="text"
                          value={skill.completionCriteria}
                          onChange={(e) => handleSkillChange(index, 'completionCriteria', e.target.value)}
                          placeholder="e.g., Completed website, 5 design mockups"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                          required
                        />
                      </div>
                    </div>

                    {/* Deliverables */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Specific Deliverables *
                      </label>
                      {skill.deliverables.map((deliverable, deliverableIndex) => (
                        <div key={deliverableIndex} className="flex items-center space-x-2 mb-2">
                          <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                          <input
                            type="text"
                            value={deliverable}
                            onChange={(e) => handleDeliverableChange(index, deliverableIndex, e.target.value)}
                            placeholder={`Deliverable ${deliverableIndex + 1} (e.g., Create 3 website pages)`}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                            required
                          />
                          {skill.deliverables.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeDeliverable(index, deliverableIndex)}
                              className="text-red-600 hover:text-red-700 cursor-pointer flex-shrink-0"
                            >
                              <X size={16} />
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addDeliverable(index)}
                        className="mt-2 text-purple-600 hover:text-purple-700 flex items-center cursor-pointer"
                      >
                        <Plus size={16} className="mr-1" />
                        Add Another Deliverable
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Terms and Conditions */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
                  <FileText size={20} className="mr-2 text-purple-600" />
                  Agreement Terms
                </h2>

                {/* Meeting Location */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Meeting/Working Location
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <select
                      value={formData.meetingLocation}
                      onChange={(e) => handleInputChange('meetingLocation', e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                    >
                      <option value="Online">Online/Remote</option>
                      <option value="In-person">In-person</option>
                      <option value="Hybrid">Hybrid (Online and In-person)</option>
                    </select>
                  </div>
                </div>

                {/* Dispute Resolution */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dispute Resolution Process *
                  </label>
                  <textarea
                    value={formData.disputeResolution}
                    onChange={(e) => handleInputChange('disputeResolution', e.target.value)}
                    placeholder="Describe how disputes will be resolved..."
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 resize-none"
                    required
                  />
                </div>

                {/* Termination Clause */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Termination Clause *
                  </label>
                  <textarea
                    value={formData.terminationClause}
                    onChange={(e) => handleInputChange('terminationClause', e.target.value)}
                    placeholder="Specify the conditions under which this agreement can be terminated..."
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 resize-none"
                    required
                  />
                </div>

                {/* Confidentiality */}
                <div className="mb-6">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.confidentiality}
                      onChange={(e) => handleInputChange('confidentiality', e.target.checked)}
                      className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Both parties agree to maintain confidentiality of shared information
                    </span>
                  </label>
                </div>

                {/* General Terms */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    General Terms & Conditions *
                  </label>
                  <textarea
                    value={formData.terms}
                    onChange={(e) => handleInputChange('terms', e.target.value)}
                    placeholder="Specify the general terms and conditions of this skill swap agreement..."
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 resize-none"
                    required
                  />
                </div>

                {/* Special Conditions */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Special Conditions
                  </label>
                  <textarea
                    value={formData.specialConditions}
                    onChange={(e) => handleInputChange('specialConditions', e.target.value)}
                    placeholder="Any additional conditions or specific requirements..."
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 resize-none"
                  />
                </div>
              </div>

              {/* Important Notice */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <div className="flex items-start space-x-3">
                  <AlertCircle size={20} className="text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-lg font-semibold text-yellow-800 mb-2">Important Notice</h3>
                    <p className="text-yellow-700 text-sm">
                      This agreement will be sent to the other party for review and acceptance. 
                      Both parties must agree to the terms before the skill swap can begin. 
                      Ensure all details are accurate and clearly defined to avoid misunderstandings.
                    </p>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition duration-200 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-purple-600 text-yellow-400 px-6 py-3 rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-200 font-semibold cursor-pointer flex items-center"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-400 mr-2"></div>
                      Creating Agreement...
                    </>
                  ) : (
                    <>
                      <FileText size={18} className="mr-2" />
                      Create Skill Swap Agreement
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
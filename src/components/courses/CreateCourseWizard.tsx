"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChapterContentBuilder, ContentBlock } from "./ChapterContentBuilder";

const STEPS = [
  { num: 1, label: "Course Details" },
  { num: 2, label: "Modules" },
  { num: 3, label: "Chapters" },
  { num: 4, label: "Q/A" },
];

type FaqItem = { question: string; answer: string };

export function CreateCourseWizard({
  initialStep,
  initialProgramId,
  initialCourseId,
  userRole,
  onStepChange,
  onSuccess,
  onClose,
  isModal = false,
}: {
  initialStep: number;
  initialProgramId: string | null;
  initialCourseId: string | null;
  userRole: string;
  onStepChange?: (step: number, programId: string | null, courseId: string | null) => void;
  onSuccess?: () => void;
  onClose?: () => void;
  isModal?: boolean;
}) {
  const router = useRouter();
  const [step, setStep] = useState(initialStep);
  const [programId, setProgramId] = useState<string | null>(initialProgramId);
  const [courseId, setCourseId] = useState<string | null>(null);
  const [programName, setProgramName] = useState<string>("");

  // Step 1 form
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [duration, setDuration] = useState("");
  const [skillOutcomes, setSkillOutcomes] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const courseImageInputRef = useRef<HTMLInputElement>(null);

  // Step 2: Modules
  const [modules, setModules] = useState<Array<{ id: string; title: string; description: string | null; order: number; lessons: Array<{ id: string; title: string; order: number }>; assignments: Array<{ id: string; title: string; order: number }> }>>([]);
  const [modulesLoading, setModulesLoading] = useState(false);
  const [showModuleForm, setShowModuleForm] = useState(false);
  const [moduleTitle, setModuleTitle] = useState("");
  const [moduleDescription, setModuleDescription] = useState("");
  const [moduleOrder, setModuleOrder] = useState(0);
  const [creatingModule, setCreatingModule] = useState(false);
  const [moduleError, setModuleError] = useState("");

  // Step 3: Chapters
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonContentBlocks, setLessonContentBlocks] = useState<ContentBlock[]>([]);
  const [lessonVideoUrl, setLessonVideoUrl] = useState("");
  const [lessonOrder, setLessonOrder] = useState(0);
  const [creatingLesson, setCreatingLesson] = useState(false);
  const [lessonError, setLessonError] = useState("");
  const [availableQuizzes, setAvailableQuizzes] = useState<Array<{ id: string; title: string }>>([]);
  const [availableAssignments, setAvailableAssignments] = useState<Array<{ id: string; title: string }>>([]);
  // Draft assignment (used by createAssignment from publish flow)
  const [assignmentTitle, setAssignmentTitle] = useState("");
  const [assignmentDescription, setAssignmentDescription] = useState("");
  const [assignmentInstructions, setAssignmentInstructions] = useState("");
  const [assignmentDueDate, setAssignmentDueDate] = useState("");
  const [assignmentOrder, setAssignmentOrder] = useState(0);
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);
  const [creatingAssignment, setCreatingAssignment] = useState(false);
  const [assignmentError, setAssignmentError] = useState("");

  // Step 4: FAQ/Q&A
  const [faqList, setFaqList] = useState<FaqItem[]>([]);
  const [faqLoading, setFaqLoading] = useState(false);
  const [faqError, setFaqError] = useState("");

  const programsBase = userRole === "ADMIN" ? "/dashboard/admin/programs" : "/dashboard/mentor/programs";

  // Draft storage key
  const getDraftKey = () => courseId ? `course-draft-${courseId}` : `course-draft-temp-${programId || 'new'}`;

  // Save draft data to localStorage
  function saveDraftToStorage() {
    const draftData = {
      step1: {
        name,
        description,
        imageUrl,
        duration,
        skillOutcomes,
        startDate,
        endDate,
      },
      step2: {
        moduleTitle,
        moduleDescription,
        moduleOrder,
      },
      step3: {
        selectedModuleId,
        lessonTitle,
        lessonContentBlocks,
        lessonVideoUrl,
        lessonOrder,
      },
      step4: {
        faqList,
      },
    };
    try {
      localStorage.setItem(getDraftKey(), JSON.stringify(draftData));
    } catch (e) {
      console.warn("Failed to save draft to localStorage:", e);
    }
  }

  // Load draft data from localStorage
  function loadDraftFromStorage() {
    try {
      const draftDataStr = localStorage.getItem(getDraftKey());
      if (draftDataStr) {
        const draftData = JSON.parse(draftDataStr);
        if (draftData.step1) {
          setName(draftData.step1.name || "");
          setDescription(draftData.step1.description || "");
          setImageUrl(draftData.step1.imageUrl || "");
          setDuration(draftData.step1.duration || "");
          setSkillOutcomes(draftData.step1.skillOutcomes || "");
          setStartDate(draftData.step1.startDate ?? "");
          setEndDate(draftData.step1.endDate ?? "");
        }
        if (draftData.step2) {
          setModuleTitle(draftData.step2.moduleTitle || "");
          setModuleDescription(draftData.step2.moduleDescription || "");
          setModuleOrder(draftData.step2.moduleOrder || 0);
        }
        if (draftData.step3) {
          setSelectedModuleId(draftData.step3.selectedModuleId || null);
          setLessonTitle(draftData.step3.lessonTitle || "");
          setLessonContentBlocks(draftData.step3.lessonContentBlocks || []);
          setLessonVideoUrl(draftData.step3.lessonVideoUrl || "");
          setLessonOrder(draftData.step3.lessonOrder || 0);
        }
        if (draftData.step4) {
          setFaqList(draftData.step4.faqList || []);
        }
      }
    } catch (e) {
      console.warn("Failed to load draft from localStorage:", e);
    }
  }

  // Clear draft data
  function clearDraft() {
    try {
      localStorage.removeItem(getDraftKey());
    } catch (e) {
      console.warn("Failed to clear draft from localStorage:", e);
    }
  }

  useEffect(() => {
    setStep(initialStep);
    setProgramId(initialProgramId);
    if (initialCourseId) setCourseId(initialCourseId);
  }, [initialStep, initialProgramId, initialCourseId]);

  // Load course data when editing (initialCourseId is provided)
  useEffect(() => {
    if (initialCourseId && step === 1) {
      fetch(`/api/courses/${initialCourseId}`)
        .then((r) => r.json())
        .then((c) => {
          if (c?.name) setName(c.name);
          if (c?.description) setDescription(c.description);
          if (c?.imageUrl) setImageUrl(c.imageUrl);
          if (c?.duration) setDuration(c.duration);
          if (c?.skillOutcomes) setSkillOutcomes(c.skillOutcomes);
          if (c?.startDate) setStartDate(new Date(c.startDate).toISOString().slice(0, 16));
          if (c?.endDate) setEndDate(new Date(c.endDate).toISOString().slice(0, 16));
          if (c?.program?.id) {
            setProgramId(c.program.id);
            setProgramName(c.program.name);
          }
        })
        .catch(() => {});
    }
  }, [initialCourseId, step]);

  // Load draft when courseId changes or when entering a step
  useEffect(() => {
    if (courseId || programId) {
      // Small delay to ensure state is ready and avoid conflicts with server data
      const timer = setTimeout(() => {
        loadDraftFromStorage();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [courseId, programId, step]);

  useEffect(() => {
    if (courseId && step === 4) {
      // Fetch course data for step 4 (FAQ)
      fetch(`/api/courses/${courseId}`)
        .then((r) => r.json())
        .then((c) => {
          if (c?.name) setProgramName(c.name);
          if (c?.program?.name) setProgramName(c.program.name);
          // Only set FAQ from server if draft doesn't have any
          // Draft will be loaded separately and will override if it exists
          if (Array.isArray(c?.faq) && faqList.length === 0) {
            setFaqList(c.faq);
          }
        })
        .catch(() => {});
    } else if (programId && step === 4) {
      // Fallback: fetch program data if no courseId
      fetch(`/api/programs/${programId}`)
        .then((r) => r.json())
        .then((p) => {
          if (p?.name) setProgramName(p.name);
          // Only set FAQ from server if draft doesn't have any
          if (Array.isArray(p?.faq) && faqList.length === 0) {
            setFaqList(p.faq);
          }
        })
        .catch(() => {});
    }
  }, [programId, courseId, step]);

  // Load modules when courseId is set
  useEffect(() => {
    if (courseId && (step === 2 || step === 3)) {
      loadModules();
    }
  }, [courseId, step]);

  // Load quizzes and assignments when module is selected
  useEffect(() => {
    if (selectedModuleId && step === 3) {
      // Load assignments for the selected module (from the modules data we already have)
      const selectedModule = modules.find(m => m.id === selectedModuleId);
      if (selectedModule) {
        setAvailableAssignments(selectedModule.assignments.map(a => ({ id: a.id, title: a.title })));
        // For now, quizzes are the same as assignments - we can differentiate later if needed
        setAvailableQuizzes(selectedModule.assignments.map(a => ({ id: a.id, title: a.title })));
      }
    }
  }, [selectedModuleId, step, modules]);

  function loadModules() {
    if (!courseId) return;
    setModulesLoading(true);
    fetch(`/api/modules?courseId=${courseId}`)
      .then((r) => r.json())
      .then((data) => {
        const modulesData = Array.isArray(data) ? data : [];
        setModules(modulesData);
        setModulesLoading(false);
        // Auto-select first module in step 3 if none selected
        if (step === 3 && !selectedModuleId && modulesData.length > 0) {
          setSelectedModuleId(modulesData[0].id);
        }
      })
      .catch(() => setModulesLoading(false));
  }

  async function createCourse() {
    setError("");
    setLoading(true);
    try {
      // Create Course (standalone - programId is optional)
      const res = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          programId: programId || undefined,
          name: name.trim(),
          description: description.trim() || undefined,
          imageUrl: imageUrl.trim() || undefined,
          duration: duration.trim() || undefined,
          skillOutcomes: skillOutcomes.trim() || undefined,
          startDate: startDate.trim() ? new Date(startDate.trim()).toISOString() : undefined,
          endDate: endDate.trim() ? new Date(endDate.trim()).toISOString() : undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const errorMsg = data.error?.message || data.error || JSON.stringify(data) || "Failed to create course";
        setError(errorMsg);
        setLoading(false);
        return false;
      }
      // Store courseId for next steps
      const newCourseId = data.id;
      setCourseId(newCourseId);
      const finalProgramId = data.program?.id || programId;
      if (data.program?.name) {
        setProgramName(data.program.name);
        setProgramId(data.program.id);
      }
      
      // Migrate draft data from temp key to course-specific key
      const tempKey = `course-draft-temp-${programId || 'new'}`;
      const courseKey = `course-draft-${newCourseId}`;
      try {
        const tempDraft = localStorage.getItem(tempKey);
        if (tempDraft) {
          localStorage.setItem(courseKey, tempDraft);
          localStorage.removeItem(tempKey);
        }
      } catch (e) {
        console.warn("Failed to migrate draft data:", e);
      }
      
      if (isModal && onStepChange) {
        onStepChange(2, finalProgramId, newCourseId);
      }
      setLoading(false);
      return true;
    } catch {
      setError("Network error");
      setLoading(false);
      return false;
    }
  }

  async function handleNext() {
    // Save current step draft before moving forward
    saveDraftToStorage();
    
    if (step === 1) {
      // Validate step 1
      if (!name.trim()) {
        setError("Course name is required");
        return;
      }
      // If editing (courseId exists), update course instead of creating
      if (courseId) {
        setLoading(true);
        setError("");
        try {
          const res = await fetch(`/api/courses/${courseId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: name.trim(),
              description: description.trim() || undefined,
              imageUrl: imageUrl.trim() || undefined,
              duration: duration.trim() || undefined,
              skillOutcomes: skillOutcomes.trim() || undefined,
              startDate: startDate.trim() ? new Date(startDate.trim()).toISOString() : null,
              endDate: endDate.trim() ? new Date(endDate.trim()).toISOString() : null,
            }),
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) {
            const errorMsg = data.error?.message || data.error || JSON.stringify(data) || "Failed to update course";
            setError(errorMsg);
            setLoading(false);
            return;
          }
          setLoading(false);
          // Move to step 2
          setStep(2);
          if (isModal && onStepChange) {
            onStepChange(2, programId, courseId);
          }
          // Load modules for step 2
          loadModules();
          // Load draft data for step 2
          setTimeout(() => loadDraftFromStorage(), 100);
        } catch (err) {
          setError("Network error");
          setLoading(false);
        }
      } else {
        // Create course and move to step 2
        const success = await createCourse();
        if (success && courseId) {
          setStep(2);
          if (isModal && onStepChange) {
            onStepChange(2, programId, courseId);
          }
          // Load modules for step 2
          loadModules();
          // Load draft data for step 2
          setTimeout(() => loadDraftFromStorage(), 100);
        }
      }
    } else if (step === 2) {
      // Create module if form data is filled before moving to step 3
      if (moduleTitle.trim()) {
        const moduleSuccess = await createModule();
        if (!moduleSuccess) {
          // Don't move to next step if module creation failed
          return;
        }
      }
      // Move to step 3 after module is created (or if no module data was filled)
      setStep(3);
      if (isModal && onStepChange) {
        onStepChange(3, programId, courseId);
      }
      loadModules();
      // Load draft data for step 3
      setTimeout(() => loadDraftFromStorage(), 100);
    } else if (step === 3) {
      // Create lesson if form data is filled before moving to step 4
      if (selectedModuleId && lessonTitle.trim()) {
        const lessonSuccess = await createLesson();
        if (!lessonSuccess) {
          // Don't move to next step if lesson creation failed
          return;
        }
      }
      // Move to step 4 (Q/A)
      setStep(4);
      if (isModal && onStepChange) {
        onStepChange(4, programId, courseId);
      }
      // Load FAQ if courseId exists
      if (courseId) {
        fetch(`/api/courses/${courseId}`)
          .then((r) => r.json())
          .then((c) => {
            if (Array.isArray(c?.faq)) setFaqList(c.faq);
            // Merge with draft data
            setTimeout(() => loadDraftFromStorage(), 100);
          })
          .catch(() => {});
      }
    }
  }

  function handlePrevious() {
    // Save current step draft before going back
    saveDraftToStorage();
    
    if (step > 1) {
      const newStep = step - 1;
      setStep(newStep);
      if (isModal && onStepChange) {
        onStepChange(newStep, programId, courseId);
      }
      // Load draft data for the step we're going back to
      setTimeout(() => loadDraftFromStorage(), 100);
      
      // Load modules if going back to step 2 or 3
      if (newStep === 2 || newStep === 3) {
        loadModules();
      }
    }
  }

  function addFaq() {
    setFaqList((prev) => [...prev, { question: "", answer: "" }]);
  }

  function removeFaq(i: number) {
    setFaqList((prev) => prev.filter((_, idx) => idx !== i));
  }

  function updateFaq(i: number, field: "question" | "answer", value: string) {
    setFaqList((prev) => prev.map((item, idx) => (idx === i ? { ...item, [field]: value } : item)));
  }

  async function saveDraft() {
    if (!courseId) return;
    setFaqError("");
    setFaqLoading(true);
    try {
      // Save FAQ to course
      const res = await fetch(`/api/courses/${courseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ faq: faqList.filter((f) => f.question.trim()) }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setFaqError(d.error || "Failed to save draft");
        setFaqLoading(false);
        return;
      }
      // Save draft data to localStorage as well
      saveDraftToStorage();
      
      // Show success message
      alert("Draft saved successfully!");
      setFaqLoading(false);
    } catch {
      setFaqError("Network error");
      setFaqLoading(false);
    }
  }

  async function createModule() {
    if (!courseId || !moduleTitle.trim()) {
      setModuleError("Module title is required");
      return false;
    }
    setModuleError("");
    setCreatingModule(true);
    try {
      const res = await fetch("/api/modules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          title: moduleTitle.trim(),
          description: moduleDescription.trim() || undefined,
          order: moduleOrder,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setModuleError(data.error?.message || JSON.stringify(data.error) || "Failed to create module");
        setCreatingModule(false);
        return false;
      }
      // Don't clear form fields - keep them as draft for user to continue editing
      // setModuleTitle("");
      // setModuleDescription("");
      // setModuleOrder(0);
      loadModules();
      setCreatingModule(false);
      // Save draft after creating module
      saveDraftToStorage();
      return true;
    } catch {
      setModuleError("Network error");
      setCreatingModule(false);
      return false;
    }
  }

  async function createLesson() {
    if (!selectedModuleId || !lessonTitle.trim()) {
      setLessonError("Lesson title is required");
      return false;
    }
    setLessonError("");
    setCreatingLesson(true);
    try {
      // First, create any new quizzes/assignments from content blocks
      const newQuizIds: string[] = [];
      const newAssignmentIds: string[] = [];
      
      for (const block of lessonContentBlocks) {
        if (block.type === "quiz" && !block.quizId && block.title.trim()) {
          // Create new quiz (as assignment)
          try {
            const quizRes = await fetch("/api/assignments", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                moduleId: selectedModuleId,
                title: block.title.trim(),
                description: "Quiz from chapter content",
                order: 0,
              }),
            });
            const quizData = await quizRes.json().catch(() => ({}));
            if (quizRes.ok && quizData.id) {
              newQuizIds.push(quizData.id);
              // Update the block with the new quiz ID
              const blockIndex = lessonContentBlocks.findIndex(b => b.id === block.id);
              if (blockIndex !== -1) {
                const updatedBlocks = [...lessonContentBlocks];
                (updatedBlocks[blockIndex] as any).quizId = quizData.id;
                setLessonContentBlocks(updatedBlocks);
              }
            }
          } catch (e) {
            console.error("Failed to create quiz:", e);
          }
        } else if (block.type === "assignment" && !block.assignmentId && block.title.trim()) {
          // Create new assignment
          try {
            const assignRes = await fetch("/api/assignments", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                moduleId: selectedModuleId,
                title: block.title.trim(),
                description: block.content || "Assignment from chapter content",
                instructions: block.htmlContent || block.content || undefined,
                order: 0,
              }),
            });
            const assignData = await assignRes.json().catch(() => ({}));
            if (assignRes.ok && assignData.id) {
              newAssignmentIds.push(assignData.id);
              // Update the block with the new assignment ID
              const blockIndex = lessonContentBlocks.findIndex(b => b.id === block.id);
              if (blockIndex !== -1) {
                const updatedBlocks = [...lessonContentBlocks];
                (updatedBlocks[blockIndex] as any).assignmentId = assignData.id;
                setLessonContentBlocks(updatedBlocks);
              }
            }
          } catch (e) {
            console.error("Failed to create assignment:", e);
          }
        }
      }

      // Convert content blocks to JSON string for storage
      const contentJson = JSON.stringify(lessonContentBlocks);
      
      const res = await fetch("/api/lessons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moduleId: selectedModuleId,
          title: lessonTitle.trim(),
          content: contentJson || undefined,
          videoUrl: lessonVideoUrl.trim() || undefined,
          order: lessonOrder,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setLessonError(data.error?.message || JSON.stringify(data.error) || "Failed to create lesson");
        setCreatingLesson(false);
        return false;
      }
      // Don't clear form fields - keep them as draft for user to continue editing
      // setLessonTitle("");
      // setLessonContentBlocks([]);
      // setLessonVideoUrl("");
      // setLessonOrder(0);
      loadModules();
      setCreatingLesson(false);
      // Save draft after creating lesson
      saveDraftToStorage();
      return true;
    } catch {
      setLessonError("Network error");
      setCreatingLesson(false);
      return false;
    }
  }

  async function createAssignment() {
    if (!selectedModuleId || !assignmentTitle.trim()) {
      setAssignmentError("Assignment title is required");
      return false;
    }
    setAssignmentError("");
    setCreatingAssignment(true);
    try {
      const res = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moduleId: selectedModuleId,
          title: assignmentTitle.trim(),
          description: assignmentDescription.trim() || undefined,
          instructions: assignmentInstructions.trim() || undefined,
          dueDate: assignmentDueDate ? new Date(assignmentDueDate).toISOString() : null,
          order: assignmentOrder,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setAssignmentError(data.error?.message || JSON.stringify(data.error) || "Failed to create assignment");
        setCreatingAssignment(false);
        return false;
      }
      setAssignmentTitle("");
      setAssignmentDescription("");
      setAssignmentInstructions("");
      setAssignmentDueDate("");
      setAssignmentOrder(0);
      setShowAssignmentForm(false);
      loadModules();
      setCreatingAssignment(false);
      return true;
    } catch {
      setAssignmentError("Network error");
      setCreatingAssignment(false);
      return false;
    }
  }

  async function publish() {
    if (!courseId) return;
    setFaqError("");
    setFaqLoading(true);
    
    try {
      // First, create any draft modules from step 2
      if (moduleTitle.trim()) {
        const moduleSuccess = await createModule();
        if (!moduleSuccess) {
          setFaqError("Failed to create module. Please check and try again.");
          setFaqLoading(false);
          return;
        }
      }
      
      // Then, create any draft lessons from step 3
      if (selectedModuleId && lessonTitle.trim()) {
        const lessonSuccess = await createLesson();
        if (!lessonSuccess) {
          setFaqError("Failed to create lesson. Please check and try again.");
          setFaqLoading(false);
          return;
        }
      }
      
      // Finally, save FAQ
      const res = await fetch(`/api/courses/${courseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ faq: faqList.filter((f) => f.question.trim()) }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setFaqError(d.error || "Failed to publish");
        setFaqLoading(false);
        return;
      }
      
      // Clear draft data after successful publish
      clearDraft();
      
      // Handle success
      if (isModal && onSuccess) {
        onSuccess();
      } else {
        // Redirect to courses list or program management page
        if (programId) {
          router.push(`/dashboard/admin/programs-management/${programId}`);
        } else {
          router.push(programsBase);
        }
        router.refresh();
      }
    } catch {
      setFaqError("Network error");
      setFaqLoading(false);
    }
  }

  // Module Creation Form Component
  function ModuleCreationForm({ courseId, onSuccess, onCancel }: { courseId: string; onSuccess: () => void; onCancel: () => void }) {
    const [moduleTitle, setModuleTitle] = useState("");
    const [moduleDescription, setModuleDescription] = useState("");
    const [moduleOrder, setModuleOrder] = useState(0);
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState("");

    async function handleCreateModule(e: React.FormEvent) {
      e.preventDefault();
      if (!moduleTitle.trim()) {
        setError("Module title is required");
        return;
      }
      setError("");
      setCreating(true);
      try {
        const res = await fetch("/api/modules", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            courseId,
            title: moduleTitle.trim(),
            description: moduleDescription.trim() || undefined,
            order: moduleOrder,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(data.error?.message || JSON.stringify(data.error) || "Failed to create module");
          setCreating(false);
          return;
        }
        setModuleTitle("");
        setModuleDescription("");
        setModuleOrder(0);
        onSuccess();
      } catch {
        setError("Network error");
      }
      setCreating(false);
    }

    return (
      <form onSubmit={handleCreateModule} className="rounded-lg border border-[#e5e7eb] dark:border-[#374151] bg-[#f9fafb] dark:bg-[#111827] p-4 space-y-3">
        <h4 className="font-medium text-[#171717] dark:text-[#f9fafb]">Create New Module</h4>
        <div>
          <label className="block text-sm font-medium text-[#374151] dark:text-[#d1d5db] mb-1">Module Title *</label>
          <input
            type="text"
            value={moduleTitle}
            onChange={(e) => setModuleTitle(e.target.value)}
            required
            className="w-full rounded-lg border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#1f2937] px-3 py-2 text-sm text-[#171717] dark:text-[#f9fafb]"
            placeholder="e.g. Module 1: Introduction"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#374151] dark:text-[#d1d5db] mb-1">Description (optional)</label>
          <textarea
            value={moduleDescription}
            onChange={(e) => setModuleDescription(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#1f2937] px-3 py-2 text-sm text-[#171717] dark:text-[#f9fafb]"
            placeholder="Brief description"
            style={{ direction: "ltr", textAlign: "left" }}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#374151] dark:text-[#d1d5db] mb-1">Order</label>
          <input
            type="number"
            min={0}
            value={moduleOrder}
            onChange={(e) => setModuleOrder(Number(e.target.value))}
            className="w-24 rounded-lg border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#1f2937] px-3 py-2 text-sm text-[#171717] dark:text-[#f9fafb]"
          />
        </div>
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-3 py-1.5 text-sm font-medium border border-[#e5e7eb] dark:border-[#374151] text-[#374151] dark:text-[#d1d5db]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={creating}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
            style={{ backgroundColor: "var(--unipod-blue)" }}
          >
            {creating ? "Creating…" : "Create Module"}
          </button>
        </div>
      </form>
    );
  }

  // Module Card Component
  function ModuleCard({
    module,
    courseId,
    isExpanded,
    onToggle,
    onRefresh,
    showLessonForm,
    showAssignmentForm,
    onShowLessonForm,
    onShowAssignmentForm,
  }: {
    module: { id: string; title: string; description: string | null; order: number; lessons: Array<{ id: string; title: string; order: number }>; assignments: Array<{ id: string; title: string; order: number }> };
    courseId: string;
    isExpanded: boolean;
    onToggle: () => void;
    onRefresh: () => void;
    showLessonForm: boolean;
    showAssignmentForm: boolean;
    onShowLessonForm: () => void;
    onShowAssignmentForm: () => void;
  }) {
    return (
      <div className="rounded-lg border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#1f2937] overflow-hidden">
        <button
          type="button"
          onClick={onToggle}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-[#f9fafb] dark:hover:bg-[#111827] transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-[#171717] dark:text-[#f9fafb]">{module.title}</span>
            <span className="text-xs text-[#6b7280] dark:text-[#9ca3af]">
              ({module.lessons.length} lessons, {module.assignments.length} assignments)
            </span>
          </div>
          <svg
            className={`w-5 h-5 text-[#6b7280] dark:text-[#9ca3af] transition-transform ${isExpanded ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {isExpanded && (
          <div className="px-4 pb-4 space-y-4 border-t border-[#e5e7eb] dark:border-[#374151] pt-4">
            {module.description && (
              <p className="text-sm text-[#6b7280] dark:text-[#9ca3af]">{module.description}</p>
            )}
            
            {/* Lessons List */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <h5 className="text-sm font-medium text-[#171717] dark:text-[#f9fafb]">Lessons (Chapters)</h5>
                <button
                  type="button"
                  onClick={onShowLessonForm}
                  className="text-xs text-[var(--unipod-blue)] hover:underline"
                >
                  {showLessonForm ? "Cancel" : "+ Add Lesson"}
                </button>
              </div>
              <p className="text-xs text-[#6b7280] dark:text-[#9ca3af] mb-2">Add lessons (chapters) to this module</p>
              {showLessonForm && (
                <LessonCreationForm
                  moduleId={module.id}
                  onSuccess={() => {
                    onRefresh();
                    onShowLessonForm();
                  }}
                  onCancel={onShowLessonForm}
                />
              )}
              {module.lessons.length === 0 ? (
                <p className="text-xs text-[#6b7280] dark:text-[#9ca3af] py-2">No lessons yet</p>
              ) : (
                <div className="space-y-1">
                  {module.lessons.map((lesson) => (
                    <div key={lesson.id} className="text-xs text-[#6b7280] dark:text-[#9ca3af] py-1 pl-3 border-l-2 border-[#e5e7eb] dark:border-[#374151]">
                      {lesson.order + 1}. {lesson.title}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Assignments List */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <h5 className="text-sm font-medium text-[#171717] dark:text-[#f9fafb]">Assignments & Quizzes</h5>
                <button
                  type="button"
                  onClick={onShowAssignmentForm}
                  className="text-xs text-[var(--unipod-blue)] hover:underline"
                >
                  {showAssignmentForm ? "Cancel" : "+ Add Assignment"}
                </button>
              </div>
              <p className="text-xs text-[#6b7280] dark:text-[#9ca3af] mb-2">Add assignments and quizzes to this module</p>
              {showAssignmentForm && (
                <AssignmentCreationForm
                  moduleId={module.id}
                  onSuccess={() => {
                    onRefresh();
                    onShowAssignmentForm();
                  }}
                  onCancel={onShowAssignmentForm}
                />
              )}
              {module.assignments.length === 0 ? (
                <p className="text-xs text-[#6b7280] dark:text-[#9ca3af] py-2">No assignments yet</p>
              ) : (
                <div className="space-y-1">
                  {module.assignments.map((assignment) => (
                    <div key={assignment.id} className="text-xs text-[#6b7280] dark:text-[#9ca3af] py-1 pl-3 border-l-2 border-[#e5e7eb] dark:border-[#374151]">
                      {assignment.order + 1}. {assignment.title}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Lesson Creation Form Component
  function LessonCreationForm({ moduleId, onSuccess, onCancel }: { moduleId: string; onSuccess: () => void; onCancel: () => void }) {
    const [lessonTitle, setLessonTitle] = useState("");
    const [lessonContent, setLessonContent] = useState("");
    const [lessonVideoUrl, setLessonVideoUrl] = useState("");
    const [lessonOrder, setLessonOrder] = useState(0);
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState("");

    async function handleCreateLesson(e: React.FormEvent) {
      e.preventDefault();
      if (!lessonTitle.trim()) {
        setError("Lesson title is required");
        return;
      }
      setError("");
      setCreating(true);
      try {
        const res = await fetch("/api/lessons", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            moduleId,
            title: lessonTitle.trim(),
            content: lessonContent.trim() || undefined,
            videoUrl: lessonVideoUrl.trim() || undefined,
            order: lessonOrder,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(data.error?.message || JSON.stringify(data.error) || "Failed to create lesson");
          setCreating(false);
          return;
        }
        setLessonTitle("");
        setLessonContent("");
        setLessonVideoUrl("");
        setLessonOrder(0);
        onSuccess();
      } catch {
        setError("Network error");
      }
      setCreating(false);
    }

    return (
      <form onSubmit={handleCreateLesson} className="rounded-lg border border-[#e5e7eb] dark:border-[#374151] bg-[#f9fafb] dark:bg-[#111827] p-3 space-y-2 mt-2">
        <div>
          <label className="block text-xs font-medium text-[#374151] dark:text-[#d1d5db] mb-1">Lesson Title *</label>
          <input
            type="text"
            value={lessonTitle}
            onChange={(e) => setLessonTitle(e.target.value)}
            required
            className="w-full rounded-lg border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#1f2937] px-2 py-1.5 text-sm text-[#171717] dark:text-[#f9fafb] placeholder:text-[#9ca3af] dark:placeholder:text-[#6b7280]"
            placeholder="e.g. Getting Started"
            style={{ color: "inherit" }}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#374151] dark:text-[#d1d5db] mb-1">Content (optional)</label>
          <textarea
            value={lessonContent}
            onChange={(e) => setLessonContent(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#1f2937] px-2 py-1.5 text-sm text-[#171717] dark:text-[#f9fafb] placeholder:text-[#9ca3af] dark:placeholder:text-[#6b7280]"
            placeholder="Lesson content"
            style={{ color: "inherit" }}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#374151] dark:text-[#d1d5db] mb-1">Video URL (optional)</label>
          <input
            type="url"
            value={lessonVideoUrl}
            onChange={(e) => setLessonVideoUrl(e.target.value)}
            className="w-full rounded-lg border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#1f2937] px-2 py-1.5 text-sm text-[#171717] dark:text-[#f9fafb] placeholder:text-[#9ca3af] dark:placeholder:text-[#6b7280]"
            placeholder="https://..."
            style={{ color: "inherit" }}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#374151] dark:text-[#d1d5db] mb-1">Order</label>
          <input
            type="number"
            min={0}
            value={lessonOrder}
            onChange={(e) => setLessonOrder(Number(e.target.value))}
            className="w-20 rounded-lg border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#1f2937] px-2 py-1.5 text-sm text-[#171717] dark:text-[#f9fafb]"
            style={{ color: "inherit" }}
          />
        </div>
        {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded px-2 py-1 text-xs font-medium border border-[#e5e7eb] dark:border-[#374151] text-[#374151] dark:text-[#d1d5db]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={creating}
            className="rounded px-2 py-1 text-xs font-medium text-white disabled:opacity-50"
            style={{ backgroundColor: "var(--unipod-blue)" }}
          >
            {creating ? "Creating…" : "Create Lesson"}
          </button>
        </div>
      </form>
    );
  }

  // Assignment Creation Form Component
  function AssignmentCreationForm({ moduleId, onSuccess, onCancel }: { moduleId: string; onSuccess: () => void; onCancel: () => void }) {
    const [assignmentTitle, setAssignmentTitle] = useState("");
    const [assignmentDescription, setAssignmentDescription] = useState("");
    const [assignmentInstructions, setAssignmentInstructions] = useState("");
    const [assignmentDueDate, setAssignmentDueDate] = useState("");
    const [assignmentOrder, setAssignmentOrder] = useState(0);
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState("");

    async function handleCreateAssignment(e: React.FormEvent) {
      e.preventDefault();
      if (!assignmentTitle.trim()) {
        setError("Assignment title is required");
        return;
      }
      setError("");
      setCreating(true);
      try {
        const res = await fetch("/api/assignments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            moduleId,
            title: assignmentTitle.trim(),
            description: assignmentDescription.trim() || undefined,
            instructions: assignmentInstructions.trim() || undefined,
            dueDate: assignmentDueDate ? new Date(assignmentDueDate).toISOString() : null,
            order: assignmentOrder,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(data.error?.message || JSON.stringify(data.error) || "Failed to create assignment");
          setCreating(false);
          return;
        }
        setAssignmentTitle("");
        setAssignmentDescription("");
        setAssignmentInstructions("");
        setAssignmentDueDate("");
        setAssignmentOrder(0);
        onSuccess();
      } catch {
        setError("Network error");
      }
      setCreating(false);
    }

    return (
      <form onSubmit={handleCreateAssignment} className="rounded-lg border border-[#e5e7eb] dark:border-[#374151] bg-[#f9fafb] dark:bg-[#111827] p-3 space-y-2 mt-2">
        <div>
          <label className="block text-xs font-medium text-[#374151] dark:text-[#d1d5db] mb-1">Assignment Title *</label>
          <input
            type="text"
            value={assignmentTitle}
            onChange={(e) => setAssignmentTitle(e.target.value)}
            required
            className="w-full rounded-lg border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#1f2937] px-2 py-1.5 text-sm text-[#171717] dark:text-[#f9fafb] placeholder:text-[#9ca3af] dark:placeholder:text-[#6b7280]"
            placeholder="e.g. Quiz 1 or Assignment 1"
            style={{ color: "inherit" }}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#374151] dark:text-[#d1d5db] mb-1">Description (optional)</label>
          <textarea
            value={assignmentDescription}
            onChange={(e) => setAssignmentDescription(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#1f2937] px-2 py-1.5 text-sm text-[#171717] dark:text-[#f9fafb] placeholder:text-[#9ca3af] dark:placeholder:text-[#6b7280]"
            placeholder="Assignment description"
            style={{ color: "inherit" }}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#374151] dark:text-[#d1d5db] mb-1">Instructions (optional)</label>
          <textarea
            value={assignmentInstructions}
            onChange={(e) => setAssignmentInstructions(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#1f2937] px-2 py-1.5 text-sm text-[#171717] dark:text-[#f9fafb] placeholder:text-[#9ca3af] dark:placeholder:text-[#6b7280]"
            placeholder="Instructions for students"
            style={{ color: "inherit" }}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#374151] dark:text-[#d1d5db] mb-1">Due Date (optional)</label>
          <input
            type="datetime-local"
            value={assignmentDueDate}
            onChange={(e) => setAssignmentDueDate(e.target.value)}
            className="w-full rounded-lg border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#1f2937] px-2 py-1.5 text-sm text-[#171717] dark:text-[#f9fafb]"
            style={{ color: "inherit" }}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#374151] dark:text-[#d1d5db] mb-1">Order</label>
          <input
            type="number"
            min={0}
            value={assignmentOrder}
            onChange={(e) => setAssignmentOrder(Number(e.target.value))}
            className="w-20 rounded-lg border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#1f2937] px-2 py-1.5 text-sm text-[#171717] dark:text-[#f9fafb]"
            style={{ color: "inherit" }}
          />
        </div>
        {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded px-2 py-1 text-xs font-medium border border-[#e5e7eb] dark:border-[#374151] text-[#374151] dark:text-[#d1d5db]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={creating}
            className="rounded px-2 py-1 text-xs font-medium text-white disabled:opacity-50"
            style={{ backgroundColor: "var(--unipod-blue)" }}
          >
            {creating ? "Creating…" : "Create Assignment"}
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className={isModal ? "" : "max-w-3xl mx-auto"}>
      {!isModal && (
        <>
          <div className="mb-6">
            <Link
              href={programId ? `/dashboard/admin/programs-management/${programId}` : programsBase}
              className="text-sm font-medium text-[#6b7280] dark:text-[#9ca3af] hover:text-[#171717] dark:hover:text-[#f9fafb]"
            >
              ← {programId ? "Program" : "Course List"}
            </Link>
          </div>
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-[#171717] dark:text-[#f9fafb]">Create New Course</h1>
            <p className="mt-1 text-[#6b7280] dark:text-[#9ca3af]">
              Create a course. Courses contain modules and lessons. You can assign this course to a program after creation. Complete each step below.
            </p>
          </div>
        </>
      )}

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-6">
        {STEPS.map((s, i) => (
          <div key={s.num} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (s.num < step || (s.num === 2 && courseId) || (s.num === 3 && courseId)) {
                  setStep(s.num);
                  if (isModal && onStepChange) {
                    onStepChange(s.num, programId, courseId);
                  }
                }
              }}
              disabled={s.num > step && !courseId}
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                step === s.num
                  ? "bg-[var(--unipod-blue)] text-white"
                  : s.num < step || (s.num === 2 && courseId) || (s.num === 3 && courseId)
                  ? "bg-[#e5e7eb] dark:bg-[#374151] text-[#6b7280] dark:text-[#9ca3af] hover:bg-[#d1d5db] dark:hover:bg-[#4b5563] cursor-pointer"
                  : "bg-[#e5e7eb] dark:bg-[#374151] text-[#6b7280] dark:text-[#9ca3af] opacity-50 cursor-not-allowed"
              }`}
            >
              {s.num}
            </button>
            <span className={`text-sm font-medium ${step === s.num ? "text-[#171717] dark:text-[#f9fafb]" : "text-[#6b7280] dark:text-[#9ca3af]"}`}>
              {s.label}
            </span>
            {i < STEPS.length - 1 && (
              <div className="mx-1 h-0.5 w-6 bg-[#e5e7eb] dark:bg-[#374151]" aria-hidden />
            )}
          </div>
        ))}
      </div>

      {/* Unified Form Container */}
      <form 
        onSubmit={(e) => {
          e.preventDefault();
          if (step === 1) {
            handleNext();
          } else if (step === 3) {
            publish();
          }
        }}
        className="rounded-xl border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#1f2937] p-6 shadow-sm space-y-6"
      >
        {/* Step 1: Course Details */}
        {step === 1 && (
          <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#374151] dark:text-[#d1d5db] mb-1">Course name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-lg border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#111827] px-3 py-2 text-[#171717] dark:text-[#f9fafb]"
              placeholder="e.g. Introduction to PDP"
              dir="ltr"
              style={{ direction: "ltr", textAlign: "left" }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#374151] dark:text-[#d1d5db] mb-1">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#111827] px-3 py-2 text-[#171717] dark:text-[#f9fafb]"
              placeholder="What this course covers"
              dir="ltr"
              style={{ direction: "ltr", textAlign: "left" }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#374151] dark:text-[#d1d5db] mb-1">Course image (optional)</label>
            <div className="flex items-start gap-4">
              <div className="shrink-0">
                {imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imageUrl}
                    alt=""
                    width={160}
                    height={100}
                    className="rounded-lg object-cover border border-[#e5e7eb] dark:border-[#374151] w-40 h-[100px]"
                  />
                ) : (
                  <div className="w-40 h-[100px] rounded-lg border-2 border-dashed border-[#e5e7eb] dark:border-[#374151] bg-[var(--sidebar-bg)] dark:bg-[#1f2937] flex items-center justify-center text-[#6b7280] dark:text-[#9ca3af] text-sm">
                    No image
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <input
                  ref={courseImageInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file || !file.type.startsWith("image/")) {
                      setError("Please select an image (PNG, JPG, GIF, WebP).");
                      return;
                    }
                    setError("");
                    setUploading(true);
                    const formData = new FormData();
                    formData.set("file", file);
                    formData.set("type", "course");
                    try {
                      const res = await fetch("/api/upload", { method: "POST", body: formData });
                      const data = await res.json().catch(() => ({}));
                      if (data?.fileUrl) setImageUrl(data.fileUrl);
                      else setError("Upload failed.");
                    } catch {
                      setError("Upload failed.");
                    }
                    setUploading(false);
                    e.target.value = "";
                  }}
                />
                <button
                  type="button"
                  onClick={() => courseImageInputRef.current?.click()}
                  disabled={uploading}
                  className="rounded-lg border border-[#e5e7eb] dark:border-[#374151] px-3 py-2 text-sm font-medium text-[#374151] dark:text-[#d1d5db] hover:bg-[var(--sidebar-bg)] dark:hover:bg-[#374151] disabled:opacity-50"
                >
                  {uploading ? "Uploading…" : imageUrl ? "Change image" : "Upload image"}
                </button>
                {imageUrl && (
                  <button
                    type="button"
                    onClick={() => setImageUrl("")}
                    className="ml-2 rounded-lg px-3 py-2 text-sm font-medium text-[#6b7280] dark:text-[#9ca3af] hover:bg-[var(--sidebar-bg)] dark:hover:bg-[#374151]"
                  >
                    Remove
                  </button>
                )}
                <p className="mt-1 text-xs text-[#6b7280] dark:text-[#9ca3af]">PNG, JPG, GIF or WebP. Used on course cards.</p>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#374151] dark:text-[#d1d5db] mb-1">Duration (optional)</label>
            <input
              type="text"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full rounded-lg border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#111827] px-3 py-2 text-[#171717] dark:text-[#f9fafb]"
              placeholder="e.g. 12 weeks"
              dir="ltr"
              style={{ direction: "ltr", textAlign: "left" }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#374151] dark:text-[#d1d5db] mb-1">What students will learn (optional)</label>
            <textarea
              value={skillOutcomes}
              onChange={(e) => setSkillOutcomes(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#111827] px-3 py-2 text-[#171717] dark:text-[#f9fafb]"
              placeholder="One outcome per line or short paragraph"
              dir="ltr"
              style={{ direction: "ltr", textAlign: "left" }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#374151] dark:text-[#d1d5db] mb-1">
              Course start (date & time)
            </label>
            <input
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-lg border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#111827] px-3 py-2 text-[#171717] dark:text-[#f9fafb]"
              dir="ltr"
              style={{ direction: "ltr", textAlign: "left" }}
            />
            <p className="mt-1 text-xs text-[#6b7280] dark:text-[#9ca3af]">
              Course is active to trainees only between start and end time. Leave empty for no restriction.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#374151] dark:text-[#d1d5db] mb-1">
              Course end (date & time)
            </label>
            <input
              type="datetime-local"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-lg border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#111827] px-3 py-2 text-[#171717] dark:text-[#f9fafb]"
              dir="ltr"
              style={{ direction: "ltr", textAlign: "left" }}
            />
          </div>
          </div>
        )}

        {/* Step 2: Curriculum */}
        {step === 2 && courseId && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-[#171717] dark:text-[#f9fafb] mb-2">Create Modules</h3>
              <p className="text-sm text-[#6b7280] dark:text-[#9ca3af]">
                Create modules for your course. You can add chapters and assignments to each module in the next step.
              </p>
            </div>

            <p className="text-[#374151] dark:text-[#d1d5db]" style={{ display: 'none' }}>
            Add <strong>modules</strong> to this course; inside each module add <strong>chapters</strong> and <strong>assignments</strong>. Trainees in this course’s cohort(s) will see them.
          </p>
            {/* Module Creation Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#374151] dark:text-[#d1d5db] mb-1">Module Title *</label>
                <input
                  type="text"
                  value={moduleTitle}
                  onChange={(e) => setModuleTitle(e.target.value)}
                  required
                  className="w-full rounded-lg border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#1f2937] px-3 py-2 text-sm text-[#171717] dark:text-[#f9fafb]"
                  placeholder="e.g. Module 1: Introduction"
                  dir="ltr"
                  style={{ direction: "ltr", textAlign: "left" }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#374151] dark:text-[#d1d5db] mb-1">Description (optional)</label>
                <textarea
                  value={moduleDescription}
                  onChange={(e) => setModuleDescription(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#1f2937] px-3 py-2 text-sm text-[#171717] dark:text-[#f9fafb]"
                  placeholder="Brief description of what trainees will learn in this module"
                  dir="ltr"
                  style={{ direction: "ltr", textAlign: "left" }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#374151] dark:text-[#d1d5db] mb-1">Order</label>
                <input
                  type="number"
                  min={0}
                  value={moduleOrder}
                  onChange={(e) => setModuleOrder(Number(e.target.value))}
                  className="w-24 rounded-lg border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#1f2937] px-3 py-2 text-sm text-[#171717] dark:text-[#f9fafb]"
                />
              </div>
              {moduleError && <p className="text-sm text-red-600 dark:text-red-400">{moduleError}</p>}
            </div>

          </div>
        )}

        {/* Step 3: Create Chapters */}
        {step === 3 && courseId && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-[#171717] dark:text-[#f9fafb] mb-2">Create Chapters</h3>
              <p className="text-sm text-[#6b7280] dark:text-[#9ca3af]">
                Select a module and add chapters (lessons) with quiz or assignment options.
              </p>
            </div>

            {/* Module Selection */}
            {modulesLoading ? (
              <div className="text-center py-4 text-sm text-[#6b7280] dark:text-[#9ca3af]">Loading modules...</div>
            ) : modules.length === 0 ? (
              <div className="rounded-lg border border-[#e5e7eb] dark:border-[#374151] bg-yellow-50 dark:bg-yellow-900/20 p-4">
                <p className="text-sm text-[#6b7280] dark:text-[#9ca3af]">
                  No modules found. Please go back to Step 2 and create at least one module first.
                </p>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-[#374151] dark:text-[#d1d5db] mb-2">Select Module *</label>
                  <select
                    value={selectedModuleId || ""}
                    onChange={(e) => setSelectedModuleId(e.target.value)}
                    className="w-full rounded-lg border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#1f2937] px-3 py-2 text-sm text-[#171717] dark:text-[#f9fafb]"
                  >
                    <option value="">-- Select a module --</option>
                    {modules.map((module) => (
                      <option key={module.id} value={module.id}>
                        {module.title}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedModuleId && (
                  <div className="space-y-4">
                    {/* Chapter (Lesson) Form with Content Builder */}
                    <div className="rounded-lg border border-[#e5e7eb] dark:border-[#374151] bg-[#f9fafb] dark:bg-[#111827] p-4 space-y-4">
                      <h4 className="font-medium text-[#171717] dark:text-[#f9fafb]">Create Chapter (Lesson)</h4>
                      
                      <div>
                        <label className="block text-sm font-medium text-[#374151] dark:text-[#d1d5db] mb-2">Chapter Title *</label>
                        <input
                          type="text"
                          value={lessonTitle}
                          onChange={(e) => setLessonTitle(e.target.value)}
                          required
                          className="w-full rounded-lg border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#1f2937] px-3 py-2 text-sm text-[#171717] dark:text-[#f9fafb]"
                          placeholder="e.g. Getting Started"
                          dir="ltr"
                          style={{ direction: "ltr", textAlign: "left" }}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-[#374151] dark:text-[#d1d5db] mb-2">Chapter Content</label>
                        <p className="text-xs text-[#6b7280] dark:text-[#9ca3af] mb-3">
                          Build your chapter content by adding blocks. You can add titles, headers, paragraphs, quizzes, assignments, images, and links.
                        </p>
                        <ChapterContentBuilder
                          content={lessonContentBlocks}
                          onChange={setLessonContentBlocks}
                          availableQuizzes={availableQuizzes}
                          availableAssignments={availableAssignments}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-[#374151] dark:text-[#d1d5db] mb-2">Video URL (optional)</label>
                        <input
                          type="url"
                          value={lessonVideoUrl}
                          onChange={(e) => setLessonVideoUrl(e.target.value)}
                          className="w-full rounded-lg border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#1f2937] px-3 py-2 text-sm text-[#171717] dark:text-[#f9fafb]"
                          placeholder="https://..."
                          dir="ltr"
                          style={{ direction: "ltr", textAlign: "left" }}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-[#374151] dark:text-[#d1d5db] mb-2">Order</label>
                        <input
                          type="number"
                          min={0}
                          value={lessonOrder}
                          onChange={(e) => setLessonOrder(Number(e.target.value))}
                          className="w-24 rounded-lg border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#1f2937] px-3 py-2 text-sm text-[#171717] dark:text-[#f9fafb]"
                        />
                      </div>

                      {lessonError && <p className="text-sm text-red-600 dark:text-red-400">{lessonError}</p>}
                    </div>


                    {/* Show existing chapters and assignments for selected module */}
                    {(() => {
                      const selectedModule = modules.find(m => m.id === selectedModuleId);
                      if (!selectedModule) return null;
                      return (
                        <div className="space-y-3">
                          {selectedModule.lessons.length > 0 && (
                            <div>
                              <h5 className="text-sm font-medium text-[#171717] dark:text-[#f9fafb] mb-2">Chapters:</h5>
                              <div className="space-y-1">
                                {selectedModule.lessons.map((lesson) => (
                                  <div key={lesson.id} className="text-xs text-[#6b7280] dark:text-[#9ca3af] py-1 pl-3 border-l-2 border-[#e5e7eb] dark:border-[#374151]">
                                    {lesson.order + 1}. {lesson.title}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {selectedModule.assignments.length > 0 && (
                            <div>
                              <h5 className="text-sm font-medium text-[#171717] dark:text-[#f9fafb] mb-2">Quizzes/Assignments:</h5>
                              <div className="space-y-1">
                                {selectedModule.assignments.map((assignment) => (
                                  <div key={assignment.id} className="text-xs text-[#6b7280] dark:text-[#9ca3af] py-1 pl-3 border-l-2 border-[#e5e7eb] dark:border-[#374151]">
                                    {assignment.order + 1}. {assignment.title}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Step 4: Q/A (FAQ) */}
        {step === 4 && courseId && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#171717] dark:text-[#f9fafb]">Questions & Answers (Q/A)</h2>
              <button
                type="button"
                onClick={addFaq}
                className="rounded-lg px-3 py-1.5 text-sm font-medium border border-[var(--unipod-blue)] text-[var(--unipod-blue)] hover:bg-[var(--unipod-blue-light)]"
              >
                + Add FAQ
              </button>
            </div>
            <div className="space-y-4">
              {faqList.length === 0 && (
                <p className="text-sm text-[#6b7280] dark:text-[#9ca3af]">No FAQs yet. Click &quot;+ Add FAQ&quot; to add one.</p>
              )}
              {faqList.map((item, i) => (
                <div key={i} className="rounded-lg border border-[#e5e7eb] dark:border-[#374151] p-4 space-y-2">
                  <div className="flex items-start gap-2">
                    <input
                      type="text"
                      value={item.question}
                      onChange={(e) => updateFaq(i, "question", e.target.value)}
                      placeholder="Question"
                      className="flex-1 rounded-lg border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#111827] px-3 py-2 text-sm text-[#171717] dark:text-[#f9fafb]"
                    />
                    <button
                      type="button"
                      onClick={() => removeFaq(i)}
                      className="p-2 text-[#6b7280] hover:text-red-600 rounded"
                      aria-label="Remove FAQ"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                  <textarea
                    value={item.answer}
                    onChange={(e) => updateFaq(i, "answer", e.target.value)}
                    placeholder="Answer"
                    rows={2}
                    className="w-full rounded-lg border border-[#e5e7eb] dark:border-[#374151] bg-white dark:bg-[#111827] px-3 py-2 text-sm text-[#171717] dark:text-[#f9fafb]"
                  />
                </div>
              ))}
            </div>
            {faqError && <p className="text-sm text-red-600 dark:text-red-400">{faqError}</p>}
          </div>
        )}

        {/* Error messages */}
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        {/* Navigation Buttons */}
        <div className="flex gap-3 pt-4 border-t border-[#e5e7eb] dark:border-[#374151]">
          {isModal && onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium border border-[#e5e7eb] dark:border-[#374151] text-[#374151] dark:text-[#d1d5db]"
            >
              Cancel
            </button>
          ) : (
            <Link
              href={programsBase}
              className="rounded-lg px-4 py-2 text-sm font-medium border border-[#e5e7eb] dark:border-[#374151] text-[#374151] dark:text-[#d1d5db]"
            >
              Cancel
            </Link>
          )}
          
          <div className="flex-1" />
          
          {step > 1 && (
            <button
              type="button"
              onClick={handlePrevious}
              className="rounded-lg px-4 py-2 text-sm font-medium border border-[#e5e7eb] dark:border-[#374151] text-[#374151] dark:text-[#d1d5db]"
            >
              ← Previous
            </button>
          )}
          
          {step < 4 ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={loading || (step === 1 && !name.trim())}
              className="rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: "var(--unipod-blue)" }}
            >
              {loading ? "Creating…" : "Next →"}
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={saveDraft}
                disabled={faqLoading}
                className="rounded-lg px-4 py-2 text-sm font-medium border border-[#e5e7eb] dark:border-[#374151] text-[#374151] dark:text-[#d1d5db] disabled:opacity-50"
              >
                {faqLoading ? "Saving…" : "Save Draft"}
              </button>
              <button
                type="button"
                onClick={publish}
                disabled={faqLoading}
                className="rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                style={{ backgroundColor: "var(--unipod-blue)" }}
              >
                {faqLoading ? "Publishing…" : isModal ? "Complete" : "Publish →"}
              </button>
            </>
          )}
        </div>
      </form>

      {step === 2 && !courseId && (
        <p className="text-[#6b7280]">Missing course. Please create a course first.</p>
      )}
      {step === 3 && !courseId && (
        <p className="text-[#6b7280]">Missing course. Please create a course first.</p>
      )}
      {step === 4 && !courseId && (
        <p className="text-[#6b7280]">Missing course. Please create a course first.</p>
      )}
    </div>
  );
}

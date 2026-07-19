"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { GraduationCap, ImagePlus, KeyRound, Mail, Pencil, Shield, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";

import { PageHeader } from "@/components/layout/page-header";
import { MotionDiv } from "@/components/motion/motion-div";
import { ProfilePhotoCropper } from "@/components/settings/profile-photo-cropper";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import {
  useChangePassword,
  useProfile,
  useUpdateProfile,
  useUploadProfilePhoto,
} from "@/hooks/use-profile";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { ApiRequestError } from "@/lib/api-client";
import { fadeUp, staggerContainer } from "@/lib/motion";
import { changePasswordSchema, type ChangePasswordInput } from "@/lib/validators/auth";
import { updateProfileSchema, type UpdateProfileInput } from "@/lib/validators/profile";
import type { SafeUser } from "@/lib/auth/constants";

const profileInputClassName =
  "rounded-xl border-border/70 bg-card/80 text-foreground placeholder:text-muted-foreground";

function hasSavedProfileData(profile: SafeUser) {
  return Boolean(
    profile.name?.trim() ||
      profile.course?.trim() ||
      profile.college?.trim() ||
      profile.semester?.trim() ||
      profile.academicYear?.trim(),
  );
}

function ProfileReadonlyField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="space-y-2">
      <p className="label-caps normal-case tracking-[0.12em] text-muted-foreground">{label}</p>
      <div className="rounded-xl border border-border/60 bg-muted/25 px-3 py-2.5 text-sm text-foreground">
        {value?.trim() ? value : "Not set"}
      </div>
    </div>
  );
}

export function SettingsView() {
  const prefersReducedMotion = useReducedMotion();
  const { data, isLoading, isError, error, refetch } = useProfile();
  const updateProfile = useUpdateProfile();
  const uploadProfilePhoto = useUploadProfilePhoto();
  const changePassword = useChangePassword();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [pendingPhoto, setPendingPhoto] = useState<File | null>(null);
  const [cropOpen, setCropOpen] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileInitialized, setProfileInitialized] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      name: "",
      course: "",
      college: "",
      semester: "",
      academicYear: "",
    },
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPasswordForm,
    formState: { errors: passwordErrors, isDirty: isPasswordDirty },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (data) {
      reset({
        name: data.name ?? "",
        course: data.course ?? "",
        college: data.college ?? "",
        semester: data.semester ?? "",
        academicYear: data.academicYear ?? "",
      });

      if (!profileInitialized) {
        setIsEditingProfile(!hasSavedProfileData(data));
        setProfileInitialized(true);
      }
    }
  }, [data, profileInitialized, reset]);

  useEffect(() => {
    if (!successMessage) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setSuccessMessage(null);
    }, 4000);

    return () => window.clearTimeout(timeout);
  }, [successMessage]);

  async function onSubmit(values: UpdateProfileInput) {
    setFormError(null);
    setSuccessMessage(null);

    try {
      await updateProfile.mutateAsync(values);
      setIsEditingProfile(false);
      setSuccessMessage("Your profile has been saved successfully.");
    } catch (mutationError) {
      const message =
        mutationError instanceof ApiRequestError
          ? mutationError.message
          : "Unable to update profile. Please try again.";
      setFormError(message);
    }
  }

  function handleStartEditingProfile() {
    setFormError(null);
    setSuccessMessage(null);
    setIsEditingProfile(true);
  }

  function handleCancelEditingProfile() {
    if (!data) {
      return;
    }

    reset({
      name: data.name ?? "",
      course: data.course ?? "",
      college: data.college ?? "",
      semester: data.semester ?? "",
      academicYear: data.academicYear ?? "",
    });
    setFormError(null);
    setIsEditingProfile(false);
  }

  async function onPasswordSubmit(values: ChangePasswordInput) {
    setFormError(null);
    setSuccessMessage(null);

    try {
      await changePassword.mutateAsync(values);
      resetPasswordForm();
      setSuccessMessage("Password updated successfully.");
    } catch (mutationError) {
      const message =
        mutationError instanceof ApiRequestError
          ? mutationError.message
          : "Unable to update password. Please try again.";
      setFormError(message);
    }
  }

  async function handleApplyPhoto(file: File) {
    setFormError(null);
    setSuccessMessage(null);

    await uploadProfilePhoto.mutateAsync(file);
    setPendingPhoto(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setSuccessMessage("Profile photo saved successfully.");
  }

  function handlePhotoSelection(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setFormError(null);
    setSuccessMessage(null);

    if (!file) {
      return;
    }

    setPendingPhoto(file);
    setCropOpen(true);
  }

  function handleCropCancel() {
    setCropOpen(false);
    setPendingPhoto(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (isError || !data) {
    return (
      <ErrorState
        message={error instanceof Error ? error.message : "Unable to load profile."}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <>
      <ProfilePhotoCropper
        file={pendingPhoto}
        open={cropOpen}
        onOpenChange={setCropOpen}
        onCancel={handleCropCancel}
        onApply={handleApplyPhoto}
        isApplying={uploadProfilePhoto.isPending}
      />

      <MotionDiv
        initial={prefersReducedMotion ? false : "hidden"}
        animate="show"
        variants={staggerContainer(0.06, 0.03)}
        className="space-y-6"
      >
        <motion.div variants={fadeUp}>
          <PageHeader
            eyebrow="Settings"
            title="Your profile"
            description="Manage your academic profile, account photo, and advanced security options."
          />
        </motion.div>

        {successMessage ? (
          <motion.div
            variants={fadeUp}
            role="status"
            aria-live="polite"
            className="rounded-2xl border border-success/30 bg-success/10 px-4 py-3 text-sm font-medium text-success shadow-soft"
          >
            {successMessage}
          </motion.div>
        ) : null}

        {formError ? (
          <motion.div
            variants={fadeUp}
            className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive shadow-soft"
          >
            {formError}
          </motion.div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-6">
            <motion.div variants={fadeUp} className="bg-panel overflow-hidden">
              <div className="border-b border-border/60 bg-gradient-to-r from-primary/10 via-accent/6 to-transparent px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-soft">
                    <GraduationCap className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="label-caps text-primary">Academic profile</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      These details are optional and help personalize your workspace.
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                {isEditingProfile ? (
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="label-caps normal-case tracking-[0.12em]">
                        Name
                      </Label>
                      <Input
                        id="name"
                        className={profileInputClassName}
                        {...register("name")}
                        aria-invalid={Boolean(errors.name)}
                      />
                      {errors.name ? (
                        <p className="text-sm text-destructive">{errors.name.message}</p>
                      ) : null}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="course" className="label-caps normal-case tracking-[0.12em]">
                        Course / program
                      </Label>
                      <Input
                        id="course"
                        className={profileInputClassName}
                        {...register("course")}
                        aria-invalid={Boolean(errors.course)}
                      />
                      {errors.course ? (
                        <p className="text-sm text-destructive">{errors.course.message}</p>
                      ) : null}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="college" className="label-caps normal-case tracking-[0.12em]">
                        College / university
                      </Label>
                      <Input
                        id="college"
                        className={profileInputClassName}
                        {...register("college")}
                        aria-invalid={Boolean(errors.college)}
                      />
                      {errors.college ? (
                        <p className="text-sm text-destructive">{errors.college.message}</p>
                      ) : null}
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="semester" className="label-caps normal-case tracking-[0.12em]">
                          Semester
                        </Label>
                        <Input
                          id="semester"
                          className={profileInputClassName}
                          {...register("semester")}
                          aria-invalid={Boolean(errors.semester)}
                        />
                        {errors.semester ? (
                          <p className="text-sm text-destructive">{errors.semester.message}</p>
                        ) : null}
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="academicYear"
                          className="label-caps normal-case tracking-[0.12em]"
                        >
                          Academic year
                        </Label>
                        <Input
                          id="academicYear"
                          className={profileInputClassName}
                          {...register("academicYear")}
                          aria-invalid={Boolean(errors.academicYear)}
                        />
                        {errors.academicYear ? (
                          <p className="text-sm text-destructive">{errors.academicYear.message}</p>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Button
                        type="submit"
                        disabled={updateProfile.isPending || !isDirty}
                        className="shadow-soft"
                      >
                        {updateProfile.isPending ? "Saving..." : "Save profile"}
                      </Button>
                      {hasSavedProfileData(data) ? (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleCancelEditingProfile}
                          disabled={updateProfile.isPending}
                          className="shadow-soft"
                        >
                          Cancel
                        </Button>
                      ) : null}
                    </div>
                  </form>
                ) : (
                  <div className="space-y-5">
                    <ProfileReadonlyField label="Name" value={data.name} />
                    <ProfileReadonlyField label="Course / program" value={data.course} />
                    <ProfileReadonlyField label="College / university" value={data.college} />
                    <div className="grid gap-4 sm:grid-cols-2">
                      <ProfileReadonlyField label="Semester" value={data.semester} />
                      <ProfileReadonlyField label="Academic year" value={data.academicYear} />
                    </div>
                    <Button type="button" onClick={handleStartEditingProfile} className="shadow-soft">
                      <Pencil className="h-4 w-4" />
                      Edit profile
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>

            <motion.div variants={fadeUp} className="bg-panel overflow-hidden">
              <div className="border-b border-border/60 bg-gradient-to-r from-primary/8 to-transparent px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-soft">
                    <Shield className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="label-caps text-primary">Advanced settings</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Update your password to keep your account secure.
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current password</Label>
                    <PasswordInput
                      id="currentPassword"
                      autoComplete="current-password"
                      className={profileInputClassName}
                      {...registerPassword("currentPassword")}
                      aria-invalid={Boolean(passwordErrors.currentPassword)}
                    />
                    {passwordErrors.currentPassword ? (
                      <p className="text-sm text-destructive">
                        {passwordErrors.currentPassword.message}
                      </p>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New password</Label>
                    <PasswordInput
                      id="newPassword"
                      autoComplete="new-password"
                      className={profileInputClassName}
                      {...registerPassword("newPassword")}
                      aria-invalid={Boolean(passwordErrors.newPassword)}
                    />
                    {passwordErrors.newPassword ? (
                      <p className="text-sm text-destructive">{passwordErrors.newPassword.message}</p>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm new password</Label>
                    <PasswordInput
                      id="confirmPassword"
                      autoComplete="new-password"
                      className={profileInputClassName}
                      {...registerPassword("confirmPassword")}
                      aria-invalid={Boolean(passwordErrors.confirmPassword)}
                    />
                    {passwordErrors.confirmPassword ? (
                      <p className="text-sm text-destructive">
                        {passwordErrors.confirmPassword.message}
                      </p>
                    ) : null}
                  </div>

                  <Button
                    type="submit"
                    variant="outline"
                    disabled={changePassword.isPending || !isPasswordDirty}
                    className="shadow-soft"
                  >
                    <KeyRound className="h-4 w-4" />
                    {changePassword.isPending ? "Updating password..." : "Update password"}
                  </Button>
                </form>
              </div>
            </motion.div>
          </div>

          <motion.div variants={fadeUp} className="space-y-6">
            <div className="bg-panel overflow-hidden">
              <div className="border-b border-border/60 bg-gradient-to-r from-accent/8 to-transparent px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/12 text-accent">
                    <User className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="label-caps text-accent">Account</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Your sign-in email cannot be changed in this MVP.
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-4 p-5 text-sm">
                <div className="rounded-xl border border-border/60 bg-muted/30 px-3.5 py-3">
                  <div className="mb-1.5 flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-3.5 w-3.5" />
                    <p className="label-caps normal-case tracking-[0.12em]">Email</p>
                  </div>
                  <p className="font-medium break-all">{data.email}</p>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="profilePhoto" className="label-caps normal-case tracking-[0.12em]">
                    Profile photo
                  </Label>

                  <div className="flex justify-center py-2">
                    <UserAvatar
                      name={data.name}
                      email={data.email}
                      photoUrl={data.profilePhotoUrl}
                      size="lg"
                    />
                  </div>

                  <input
                    ref={fileInputRef}
                    id="profilePhoto"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="sr-only"
                    onChange={handlePhotoSelection}
                  />

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full shadow-soft"
                    disabled={uploadProfilePhoto.isPending}
                  >
                    <ImagePlus className="h-4 w-4" />
                    {data.profilePhotoUrl ? "Change photo" : "Upload photo"}
                  </Button>

                  <p className="text-xs text-muted-foreground">
                    Choose a photo from your device, crop it, and save. JPG, PNG, WEBP, or GIF up to
                    5 MB.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </MotionDiv>
    </>
  );
}

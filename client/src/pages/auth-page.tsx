import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema, InsertUser } from "@shared/schema";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DumbbellIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useState } from "react";
import * as z from 'zod';
import { apiRequest } from "@/utils/api";
import { toast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useMutation } from "@tanstack/react-query";


export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { user, loginMutation, registerMutation } = useAuth();
  const { t } = useTranslation();

  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const forgotPasswordForm = useForm({
    resolver: zodResolver(
      z.object({
        email: z.string().email(t('auth.invalidEmail')),
      })
    ),
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: async (data: { email: string }) => {
      const res = await apiRequest("POST", "/api/forgot-password", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: t('auth.checkEmail'),
        description: t('auth.resetLinkSent'),
      });
      setShowForgotPassword(false);
    },
    onError: (error: Error) => {
      toast({
        title: t('auth.error'),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const loginForm = useForm<InsertUser>({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm<InsertUser>({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      username: "",
      password: "",
      email: "",
      role: "admin",
    },
  });

  if (user) {
    setLocation("/");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl grid md:grid-cols-2 gap-8 items-center">
        <div className="text-center md:text-left space-y-4">
          <div className="flex items-center justify-center md:justify-start gap-2 mb-8">
            <DumbbellIcon className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">Sports School CRM</h1>
            <div className="ml-4">
              <LanguageSwitcher />
            </div>
          </div>
          <h2 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent">
            {t('auth.welcome')}
          </h2>
          <p className="text-lg text-muted-foreground">
            {t('auth.signInDescription')}
          </p>
        </div>

        <Card className="w-full">
          <CardHeader>
            <CardTitle>{t('auth.welcome')}</CardTitle>
            <CardDescription>{t('auth.signInDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">{t('auth.login')}</TabsTrigger>
                <TabsTrigger value="register">{t('auth.register')}</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit((data) => loginMutation.mutate(data))} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('auth.username')}</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('auth.password')}</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-between items-center mt-2">
                      <Button
                        variant="link"
                        type="button"
                        className="px-0 text-sm"
                        onClick={() => setShowForgotPassword(true)}
                      >
                        {t('auth.forgotPassword')}
                      </Button>
                    </div>
                    <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
                      {loginMutation.isPending ? "Signing in..." : t('auth.login')}
                    </Button>
                  </form>
                </Form>
              </TabsContent>

              <TabsContent value="register">
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit((data) => registerMutation.mutate(data))} className="space-y-4">
                    <FormField
                      control={registerForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('auth.username')}</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('auth.password')}</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('auth.email')}</FormLabel>
                          <FormControl>
                            <Input type="email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" disabled={registerMutation.isPending}>
                      {registerMutation.isPending ? "Creating account..." : t('auth.createAccount')}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
            <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('auth.resetPassword')}</DialogTitle>
                  <DialogDescription>
                    {t('auth.resetPasswordDescription')}
                  </DialogDescription>
                </DialogHeader>
                <Form {...forgotPasswordForm}>
                  <form
                    onSubmit={forgotPasswordForm.handleSubmit((data) =>
                      forgotPasswordMutation.mutate(data)
                    )}
                    className="space-y-4"
                  >
                    <FormField
                      control={forgotPasswordForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('auth.email')}</FormLabel>
                          <FormControl>
                            <Input type="email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={forgotPasswordMutation.isPending}
                    >
                      {forgotPasswordMutation.isPending
                        ? t('auth.sending')
                        : t('auth.sendResetLink')}
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
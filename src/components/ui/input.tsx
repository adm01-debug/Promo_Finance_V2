import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Search, X, Check, AlertCircle, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

// ============================================================================
// INPUT BASE MELHORADO
// ============================================================================

export interface InputProps extends React.ComponentProps<"input"> {
  variant?: "default" | "filled" | "underline";
  inputSize?: "sm" | "md" | "lg";
  error?: boolean;
  success?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant = "default", inputSize = "md", error, success, ...props }, ref) => {
    const variants = {
      default: "border border-input bg-background rounded-md",
      filled: "border-0 bg-muted rounded-md",
      underline: "border-0 border-b-2 border-input rounded-none bg-transparent px-0",
    };

    const sizes = {
      sm: "h-8 text-xs px-2",
      md: "h-10 text-sm px-3",
      lg: "h-12 text-base px-4",
    };

    return (
      <input
        type={type}
        className={cn(
          "flex w-full py-2 ring-offset-background transition-all duration-200",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
          "placeholder:text-muted-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          variants[variant],
          sizes[inputSize],
          error && "border-destructive focus-visible:ring-destructive",
          success && "border-green-500 focus-visible:ring-green-500",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

// ============================================================================
// FLOATING LABEL INPUT
// ============================================================================

interface FloatingLabelInputProps extends InputProps {
  label: string;
  id: string;
}

const FloatingLabelInput = React.forwardRef<HTMLInputElement, FloatingLabelInputProps>(
  ({ label, id, className, error, success, ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false);
    const [hasValue, setHasValue] = React.useState(false);

    const handleFocus = () => setIsFocused(true);
    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      setHasValue(!!e.target.value);
    };
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setHasValue(!!e.target.value);
      props.onChange?.(e);
    };

    const isFloating = isFocused || hasValue;

    return (
      <div className="relative">
        <Input
          id={id}
          ref={ref}
          className={cn("peer pt-5", className)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChange={handleChange}
          error={error}
          success={success}
          {...props}
        />
        <motion.label
          htmlFor={id}
          initial={false}
          animate={{
            y: isFloating ? -8 : 0,
            scale: isFloating ? 0.75 : 1,
            color: isFocused 
              ? error ? "hsl(var(--destructive))" 
              : success ? "hsl(142, 71%, 45%)" 
              : "hsl(var(--primary))"
              : "hsl(var(--muted-foreground))",
          }}
          transition={{ duration: 0.2 }}
          className={cn(
            "absolute left-3 top-1/2 -translate-y-1/2 origin-left pointer-events-none",
            "text-sm transition-colors",
          )}
        >
          {label}
        </motion.label>
      </div>
    );
  },
);
FloatingLabelInput.displayName = "FloatingLabelInput";

// ============================================================================
// PASSWORD INPUT
// ============================================================================

interface PasswordInputProps extends Omit<InputProps, "type"> {
  showStrength?: boolean;
}

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, showStrength, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const [strength, setStrength] = React.useState(0);

    const calculateStrength = (password: string) => {
      let score = 0;
      if (password.length >= 8) score++;
      if (/[A-Z]/.test(password)) score++;
      if (/[a-z]/.test(password)) score++;
      if (/[0-9]/.test(password)) score++;
      if (/[^A-Za-z0-9]/.test(password)) score++;
      return score;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (showStrength) {
        setStrength(calculateStrength(e.target.value));
      }
      props.onChange?.(e);
    };

    const strengthColors = ["bg-destructive", "bg-orange-500", "bg-yellow-500", "bg-lime-500", "bg-green-500"];
    const strengthLabels = ["Muito fraca", "Fraca", "Média", "Forte", "Muito forte"];

    return (
      <div className="space-y-2">
        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            className={cn("pr-10", className)}
            ref={ref}
            onChange={handleChange}
            {...props}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={showPassword ? "eye-off" : "eye"}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.15 }}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </motion.div>
            </AnimatePresence>
          </button>
        </div>
        {showStrength && props.value && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-1"
          >
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  className={cn(
                    "h-1 flex-1 rounded-full bg-muted",
                    i < strength && strengthColors[strength - 1],
                  )}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: i < strength ? 1 : 0.5 }}
                  transition={{ delay: i * 0.05 }}
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {strength > 0 ? strengthLabels[strength - 1] : "Digite uma senha"}
            </p>
          </motion.div>
        )}
      </div>
    );
  },
);
PasswordInput.displayName = "PasswordInput";

// ============================================================================
// SEARCH INPUT
// ============================================================================

interface SearchInputProps extends Omit<InputProps, "type"> {
  onClear?: () => void;
  loading?: boolean;
}

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, onClear, loading, value, ...props }, ref) => {
    const hasValue = !!value;

    return (
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          className={cn("pl-10 pr-10", className)}
          ref={ref}
          value={value}
          {...props}
        />
        <AnimatePresence>
          {(hasValue || loading) && (
            <motion.button
              type="button"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={loading ? undefined : onClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <X className="h-4 w-4" />
              )}
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    );
  },
);
SearchInput.displayName = "SearchInput";

// ============================================================================
// INPUT WITH VALIDATION
// ============================================================================

interface ValidatedInputProps extends InputProps {
  validationState?: "idle" | "validating" | "valid" | "invalid";
  validationMessage?: string;
}

const ValidatedInput = React.forwardRef<HTMLInputElement, ValidatedInputProps>(
  ({ className, validationState = "idle", validationMessage, ...props }, ref) => {
    const icons = {
      idle: null,
      validating: <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />,
      valid: <Check className="h-4 w-4 text-green-500" />,
      invalid: <AlertCircle className="h-4 w-4 text-destructive" />,
    };

    return (
      <div className="space-y-1">
        <div className="relative">
          <Input
            className={cn("pr-10", className)}
            ref={ref}
            error={validationState === "invalid"}
            success={validationState === "valid"}
            {...props}
          />
          <AnimatePresence mode="wait">
            {icons[validationState] && (
              <motion.div
                key={validationState}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                {icons[validationState]}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <AnimatePresence>
          {validationMessage && validationState !== "idle" && (
            <motion.p
              initial={{ opacity: 0, y: -5, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -5, height: 0 }}
              className={cn(
                "text-xs",
                validationState === "invalid" && "text-destructive",
                validationState === "valid" && "text-green-500",
              )}
            >
              {validationMessage}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    );
  },
);
ValidatedInput.displayName = "ValidatedInput";

// ============================================================================
// INPUT GROUP
// ============================================================================

interface InputGroupProps {
  children: React.ReactNode;
  className?: string;
}

const InputGroup = ({ children, className }: InputGroupProps) => {
  return (
    <div className={cn("flex", className)}>
      {React.Children.map(children, (child, index) => {
        if (!React.isValidElement(child)) return child;
        
        const isFirst = index === 0;
        const isLast = index === React.Children.count(children) - 1;
        
        return React.cloneElement(child as React.ReactElement<{ className?: string }>, {
          className: cn(
            (child as React.ReactElement<{ className?: string }>).props.className,
            !isFirst && "rounded-l-none border-l-0",
            !isLast && "rounded-r-none",
          ),
        });
      })}
    </div>
  );
};

// ============================================================================
// INPUT ADDON
// ============================================================================

interface InputAddonProps {
  children: React.ReactNode;
  position?: "left" | "right";
  className?: string;
}

const InputAddon = ({ children, position = "left", className }: InputAddonProps) => {
  return (
    <div
      className={cn(
        "flex items-center justify-center px-3 border border-input bg-muted text-muted-foreground text-sm",
        position === "left" ? "rounded-l-md border-r-0" : "rounded-r-md border-l-0",
        className,
      )}
    >
      {children}
    </div>
  );
};

export {
  Input,
  FloatingLabelInput,
  PasswordInput,
  SearchInput,
  ValidatedInput,
  InputGroup,
  InputAddon,
};

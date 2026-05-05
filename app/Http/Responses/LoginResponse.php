<?php

namespace App\Http\Responses;

use Illuminate\Http\JsonResponse;
use Laravel\Fortify\Contracts\LoginResponse as LoginResponseContract;
use Symfony\Component\HttpFoundation\Response;

class LoginResponse implements LoginResponseContract
{
    /**
     * Create an HTTP response that represents the object.
     */
    public function toResponse($request): JsonResponse|Response
    {
        $home = $request->user()?->isAdmin() ? '/dashboard' : '/';

        if ($request->wantsJson()) {
            return new JsonResponse(['two_factor' => false], 200);
        }

        return redirect()->intended($home);
    }
}

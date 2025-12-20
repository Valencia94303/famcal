# FamCal Android Architecture Guide

This document describes the architecture, patterns, and code organization for the FamCal Android companion app.

## Architecture Overview

The app follows **MVVM + Clean Architecture** principles, separating concerns into distinct layers:

```
┌─────────────────────────────────────────────────────────────┐
│                     Presentation Layer                       │
│  ┌─────────────────┐  ┌─────────────────┐                   │
│  │   Composables   │  │   ViewModels    │                   │
│  │   (UI Screens)  │◄─┤   (UI State)    │                   │
│  └─────────────────┘  └────────┬────────┘                   │
└────────────────────────────────┼────────────────────────────┘
                                 │
┌────────────────────────────────┼────────────────────────────┐
│                      Domain Layer                            │
│  ┌─────────────────┐  ┌────────▼────────┐                   │
│  │  Domain Models  │  │    Use Cases    │                   │
│  │  (Entities)     │  │ (Business Logic)│                   │
│  └─────────────────┘  └────────┬────────┘                   │
│  ┌─────────────────────────────┼───────────────────────────┐│
│  │          Repository Interfaces (Contracts)              ││
│  └─────────────────────────────┼───────────────────────────┘│
└────────────────────────────────┼────────────────────────────┘
                                 │
┌────────────────────────────────┼────────────────────────────┐
│                       Data Layer                             │
│  ┌─────────────────────────────▼───────────────────────────┐│
│  │            Repository Implementations                    ││
│  └─────────────────────────────┬───────────────────────────┘│
│  ┌─────────────────┐  ┌────────▼────────┐                   │
│  │   DTOs/Mappers  │  │   API Service   │                   │
│  │  (Data Models)  │  │   (Retrofit)    │                   │
│  └─────────────────┘  └─────────────────┘                   │
└─────────────────────────────────────────────────────────────┘
```

## Package Structure

```
com.famcal.android/
│
├── FamCalApplication.kt              # Application class with Hilt
│
├── core/                             # Shared infrastructure
│   ├── di/                           # Dependency injection modules
│   │   ├── AppModule.kt              # Application-scoped dependencies
│   │   ├── NetworkModule.kt          # Retrofit, OkHttp, Moshi
│   │   └── RepositoryModule.kt       # Repository bindings
│   │
│   ├── network/                      # Network infrastructure
│   │   ├── FamCalApi.kt              # Retrofit API interface
│   │   ├── ApiResult.kt              # Sealed class for API responses
│   │   ├── AuthInterceptor.kt        # Session cookie management
│   │   ├── SessionManager.kt         # Credential storage
│   │   └── NetworkConfig.kt          # Base URL configuration
│   │
│   ├── util/                         # Utilities
│   │   ├── DateUtils.kt              # Date formatting helpers
│   │   ├── Extensions.kt             # Kotlin extension functions
│   │   └── Constants.kt              # App-wide constants
│   │
│   └── ui/                           # Shared UI
│       ├── theme/                    # Material 3 theme
│       │   ├── Theme.kt              # App theme definition
│       │   ├── Color.kt              # Color palette
│       │   └── Type.kt               # Typography
│       │
│       └── components/               # Reusable composables
│           ├── LoadingIndicator.kt   # Loading spinner
│           ├── ErrorMessage.kt       # Error display
│           ├── PointsBadge.kt        # Points display chip
│           ├── MemberAvatar.kt       # Family member avatar
│           ├── ConfirmDialog.kt      # Confirmation dialogs
│           └── PullToRefresh.kt      # Pull-to-refresh wrapper
│
├── domain/                           # Business logic layer
│   ├── model/                        # Domain entities
│   │   ├── FamilyMember.kt
│   │   ├── Chore.kt
│   │   ├── Habit.kt
│   │   ├── Reward.kt
│   │   ├── RewardRedemption.kt
│   │   ├── PointTransaction.kt
│   │   ├── Task.kt
│   │   ├── ShoppingItem.kt
│   │   ├── ScheduleItem.kt
│   │   ├── CalendarEvent.kt
│   │   ├── Settings.kt
│   │   ├── AuditLog.kt
│   │   └── AuthState.kt
│   │
│   ├── repository/                   # Repository interfaces
│   │   ├── AuthRepository.kt
│   │   ├── FamilyRepository.kt
│   │   ├── ChoreRepository.kt
│   │   ├── HabitRepository.kt
│   │   ├── RewardRepository.kt
│   │   ├── PointsRepository.kt
│   │   ├── TaskRepository.kt
│   │   ├── ShoppingRepository.kt
│   │   ├── ScheduleRepository.kt
│   │   ├── CalendarRepository.kt
│   │   ├── SettingsRepository.kt
│   │   └── AuditRepository.kt
│   │
│   └── usecase/                      # Use cases (optional, for complex logic)
│       ├── auth/
│       │   ├── VerifyPinUseCase.kt
│       │   ├── CheckSessionUseCase.kt
│       │   └── LogoutUseCase.kt
│       ├── chores/
│       │   ├── GetTodayChoresUseCase.kt
│       │   └── CompleteChoreUseCase.kt
│       └── rewards/
│           ├── RequestRedemptionUseCase.kt
│           └── ApproveRedemptionUseCase.kt
│
├── data/                             # Data access layer
│   ├── remote/                       # API data models
│   │   ├── request/                  # Request DTOs
│   │   │   ├── PinVerifyRequest.kt
│   │   │   ├── CreateChoreRequest.kt
│   │   │   ├── CompleteChoreRequest.kt
│   │   │   └── ...
│   │   │
│   │   ├── response/                 # Response DTOs
│   │   │   ├── PinStatusResponse.kt
│   │   │   ├── FamilyResponse.kt
│   │   │   ├── ChoresResponse.kt
│   │   │   └── ...
│   │   │
│   │   └── mapper/                   # DTO to domain mappers
│   │       └── DomainMappers.kt
│   │
│   └── repository/                   # Repository implementations
│       ├── AuthRepositoryImpl.kt
│       ├── FamilyRepositoryImpl.kt
│       ├── ChoreRepositoryImpl.kt
│       └── ...
│
└── feature/                          # Feature modules (UI)
    ├── auth/
    │   ├── AuthViewModel.kt
    │   ├── ServerConfigScreen.kt
    │   ├── PinEntryScreen.kt
    │   └── MemberSelectScreen.kt
    │
    ├── dashboard/
    │   ├── DashboardViewModel.kt
    │   ├── DashboardScreen.kt
    │   └── widgets/
    │       ├── WeatherWidget.kt
    │       ├── CalendarWidget.kt
    │       ├── ChoresWidget.kt
    │       └── PointsWidget.kt
    │
    ├── chores/
    │   ├── ChoresViewModel.kt
    │   ├── ChoresScreen.kt
    │   ├── ChoreDetailScreen.kt
    │   └── ChoreFormDialog.kt
    │
    ├── habits/
    │   ├── HabitsViewModel.kt
    │   ├── HabitsScreen.kt
    │   └── HabitFormDialog.kt
    │
    ├── rewards/
    │   ├── RewardsViewModel.kt
    │   ├── RewardsScreen.kt
    │   ├── RedemptionsScreen.kt
    │   └── RewardFormDialog.kt
    │
    ├── points/
    │   ├── PointsViewModel.kt
    │   ├── PointsScreen.kt
    │   └── PointsLedgerScreen.kt
    │
    ├── tasks/
    │   ├── TasksViewModel.kt
    │   ├── TasksScreen.kt
    │   └── TaskFormDialog.kt
    │
    ├── shopping/
    │   ├── ShoppingViewModel.kt
    │   ├── ShoppingScreen.kt
    │   └── ShoppingItemDialog.kt
    │
    ├── schedule/
    │   ├── ScheduleViewModel.kt
    │   ├── ScheduleScreen.kt
    │   └── ScheduleItemDialog.kt
    │
    ├── calendar/
    │   ├── CalendarViewModel.kt
    │   └── CalendarScreen.kt
    │
    ├── settings/
    │   ├── SettingsViewModel.kt
    │   ├── SettingsScreen.kt
    │   ├── BackupScreen.kt
    │   └── AuditLogScreen.kt
    │
    └── navigation/
        ├── FamCalNavHost.kt
        ├── NavRoutes.kt
        └── BottomNavBar.kt
```

## State Management

### ViewModel Pattern

Each screen has a corresponding ViewModel that:
- Holds UI state as `StateFlow`
- Exposes one-time events via `Channel`
- Handles user actions
- Communicates with repositories/use cases

```kotlin
@HiltViewModel
class ChoresViewModel @Inject constructor(
    private val choresRepository: ChoreRepository,
    private val sessionManager: SessionManager
) : ViewModel() {

    // UI State - single source of truth
    private val _uiState = MutableStateFlow(ChoresUiState())
    val uiState: StateFlow<ChoresUiState> = _uiState.asStateFlow()

    // One-time events (snackbar, navigation)
    private val _events = Channel<ChoresEvent>(Channel.BUFFERED)
    val events = _events.receiveAsFlow()

    init {
        loadChores()
    }

    fun loadChores() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }

            when (val result = choresRepository.getChores()) {
                is ApiResult.Success -> {
                    _uiState.update {
                        it.copy(isLoading = false, chores = result.data)
                    }
                }
                is ApiResult.Error -> {
                    _uiState.update {
                        it.copy(isLoading = false, error = result.message)
                    }
                }
            }
        }
    }

    fun completeChore(choreId: String) {
        viewModelScope.launch {
            val memberId = sessionManager.getCurrentMemberId() ?: return@launch

            when (val result = choresRepository.completeChore(choreId, memberId)) {
                is ApiResult.Success -> {
                    _events.send(ChoresEvent.ChoreCompleted(result.data.pointsAwarded))
                    loadChores()
                }
                is ApiResult.Error -> {
                    _events.send(ChoresEvent.Error(result.message))
                }
            }
        }
    }
}

// UI State data class
data class ChoresUiState(
    val isLoading: Boolean = true,
    val chores: List<Chore> = emptyList(),
    val error: String? = null
)

// One-time events
sealed class ChoresEvent {
    data class ChoreCompleted(val points: Int) : ChoresEvent()
    data class Error(val message: String) : ChoresEvent()
}
```

### Screen Composition

```kotlin
@Composable
fun ChoresScreen(
    viewModel: ChoresViewModel = hiltViewModel(),
    onChoreClick: (String) -> Unit,
    onCreateChore: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val snackbarHostState = remember { SnackbarHostState() }

    // Handle one-time events
    LaunchedEffect(Unit) {
        viewModel.events.collect { event ->
            when (event) {
                is ChoresEvent.ChoreCompleted -> {
                    snackbarHostState.showSnackbar(
                        "Chore completed! +${event.points} points"
                    )
                }
                is ChoresEvent.Error -> {
                    snackbarHostState.showSnackbar(event.message)
                }
            }
        }
    }

    Scaffold(
        snackbarHost = { SnackbarHost(snackbarHostState) },
        floatingActionButton = {
            if (viewModel.isParent()) {
                FloatingActionButton(onClick = onCreateChore) {
                    Icon(Icons.Default.Add, "Create Chore")
                }
            }
        }
    ) { padding ->
        ChoresContent(
            uiState = uiState,
            onChoreClick = onChoreClick,
            onCompleteChore = viewModel::completeChore,
            onRefresh = viewModel::loadChores,
            modifier = Modifier.padding(padding)
        )
    }
}
```

## Network Layer

### API Result Wrapper

```kotlin
sealed class ApiResult<out T> {
    data class Success<T>(val data: T) : ApiResult<T>()
    data class Error(
        val message: String,
        val code: Int? = null,
        val exception: Throwable? = null
    ) : ApiResult<Nothing>()
}

// Safe API call wrapper
suspend fun <T> safeApiCall(
    apiCall: suspend () -> Response<T>
): ApiResult<T> {
    return try {
        val response = apiCall()
        if (response.isSuccessful) {
            response.body()?.let { ApiResult.Success(it) }
                ?: ApiResult.Error("Empty response body")
        } else {
            val errorBody = response.errorBody()?.string()
            ApiResult.Error(
                message = parseErrorMessage(errorBody) ?: "Request failed",
                code = response.code()
            )
        }
    } catch (e: IOException) {
        ApiResult.Error("Network error: Check your connection", exception = e)
    } catch (e: Exception) {
        ApiResult.Error("Unexpected error: ${e.message}", exception = e)
    }
}
```

### Authentication Interceptor

```kotlin
class AuthInterceptor(
    private val sessionManager: SessionManager
) : Interceptor {

    override fun intercept(chain: Interceptor.Chain): Response {
        val request = chain.request().newBuilder().apply {
            // Add session cookie
            sessionManager.getSessionToken()?.let { token ->
                addHeader("Cookie", "famcal-pin-session=$token")
            }

            // Add member ID header
            sessionManager.getCurrentMemberId()?.let { memberId ->
                addHeader("x-member-id", memberId)
            }
        }.build()

        val response = chain.proceed(request)

        // Save session cookie from response
        response.headers("Set-Cookie").forEach { cookie ->
            if (cookie.startsWith("famcal-pin-session=")) {
                val token = cookie
                    .substringAfter("famcal-pin-session=")
                    .substringBefore(";")
                sessionManager.saveSessionToken(token)
            }
        }

        return response
    }
}
```

## Dependency Injection

### Hilt Modules

```kotlin
// AppModule.kt
@Module
@InstallIn(SingletonComponent::class)
object AppModule {

    @Provides
    @Singleton
    fun provideSessionManager(
        @ApplicationContext context: Context
    ): SessionManager = SessionManager(context)
}

// NetworkModule.kt
@Module
@InstallIn(SingletonComponent::class)
object NetworkModule {

    @Provides
    @Singleton
    fun provideOkHttpClient(
        sessionManager: SessionManager
    ): OkHttpClient = OkHttpClient.Builder()
        .addInterceptor(AuthInterceptor(sessionManager))
        .addInterceptor(HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BODY
        })
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .build()

    @Provides
    @Singleton
    fun provideMoshi(): Moshi = Moshi.Builder()
        .add(KotlinJsonAdapterFactory())
        .build()

    @Provides
    @Singleton
    fun provideRetrofit(
        client: OkHttpClient,
        moshi: Moshi,
        sessionManager: SessionManager
    ): Retrofit = Retrofit.Builder()
        .baseUrl(sessionManager.getServerUrl() ?: "http://localhost:3000/")
        .client(client)
        .addConverterFactory(MoshiConverterFactory.create(moshi))
        .build()

    @Provides
    @Singleton
    fun provideFamCalApi(retrofit: Retrofit): FamCalApi =
        retrofit.create(FamCalApi::class.java)
}

// RepositoryModule.kt
@Module
@InstallIn(SingletonComponent::class)
abstract class RepositoryModule {

    @Binds
    @Singleton
    abstract fun bindAuthRepository(impl: AuthRepositoryImpl): AuthRepository

    @Binds
    @Singleton
    abstract fun bindChoreRepository(impl: ChoreRepositoryImpl): ChoreRepository

    // ... other bindings
}
```

## Navigation

### Navigation Routes

```kotlin
sealed class NavRoutes(val route: String) {
    // Auth flow
    object ServerConfig : NavRoutes("server_config")
    object PinEntry : NavRoutes("pin_entry")
    object MemberSelect : NavRoutes("member_select")

    // Main screens
    object Dashboard : NavRoutes("dashboard")
    object Chores : NavRoutes("chores")
    object ChoreDetail : NavRoutes("chores/{choreId}") {
        fun createRoute(choreId: String) = "chores/$choreId"
    }
    object Habits : NavRoutes("habits")
    object Rewards : NavRoutes("rewards")
    object Redemptions : NavRoutes("redemptions")
    object Points : NavRoutes("points")
    object PointsLedger : NavRoutes("points/{memberId}/ledger") {
        fun createRoute(memberId: String) = "points/$memberId/ledger"
    }
    object Tasks : NavRoutes("tasks")
    object Shopping : NavRoutes("shopping")
    object Schedule : NavRoutes("schedule")
    object Calendar : NavRoutes("calendar")
    object Settings : NavRoutes("settings")
    object Backup : NavRoutes("backup")
    object AuditLog : NavRoutes("audit_log")
    object Family : NavRoutes("family")
}
```

### NavHost Setup

```kotlin
@Composable
fun FamCalNavHost(
    navController: NavHostController,
    startDestination: String,
    modifier: Modifier = Modifier
) {
    NavHost(
        navController = navController,
        startDestination = startDestination,
        modifier = modifier
    ) {
        // Auth flow
        composable(NavRoutes.ServerConfig.route) {
            ServerConfigScreen(
                onConnected = { navController.navigate(NavRoutes.PinEntry.route) }
            )
        }

        composable(NavRoutes.PinEntry.route) {
            PinEntryScreen(
                onAuthenticated = { navController.navigate(NavRoutes.MemberSelect.route) }
            )
        }

        composable(NavRoutes.MemberSelect.route) {
            MemberSelectScreen(
                onMemberSelected = {
                    navController.navigate(NavRoutes.Dashboard.route) {
                        popUpTo(NavRoutes.ServerConfig.route) { inclusive = true }
                    }
                }
            )
        }

        // Main screens
        composable(NavRoutes.Dashboard.route) {
            DashboardScreen(
                onNavigateToChores = { navController.navigate(NavRoutes.Chores.route) },
                onNavigateToHabits = { navController.navigate(NavRoutes.Habits.route) },
                // ... other navigation
            )
        }

        composable(NavRoutes.Chores.route) {
            ChoresScreen(
                onChoreClick = { choreId ->
                    navController.navigate(NavRoutes.ChoreDetail.createRoute(choreId))
                }
            )
        }

        composable(
            route = NavRoutes.ChoreDetail.route,
            arguments = listOf(navArgument("choreId") { type = NavType.StringType })
        ) { backStackEntry ->
            ChoreDetailScreen(
                choreId = backStackEntry.arguments?.getString("choreId") ?: "",
                onBack = { navController.popBackStack() }
            )
        }

        // ... other screens
    }
}
```

## Role-Based UI

### Session Manager

```kotlin
class SessionManager(context: Context) {
    private val prefs = context.getSharedPreferences("famcal", Context.MODE_PRIVATE)

    fun getCurrentMemberRole(): String? =
        prefs.getString("member_role", null)

    fun isParent(): Boolean =
        getCurrentMemberRole() == "PARENT"

    fun isChild(): Boolean =
        getCurrentMemberRole() == "CHILD"
}
```

### Conditional UI

```kotlin
@Composable
fun RewardsScreen(viewModel: RewardsViewModel = hiltViewModel()) {
    val isParent = viewModel.isParent()

    Scaffold(
        floatingActionButton = {
            // Only parents can create rewards
            if (isParent) {
                FloatingActionButton(onClick = { /* show create dialog */ }) {
                    Icon(Icons.Default.Add, "Create Reward")
                }
            }
        }
    ) { padding ->
        // Content visible to all
        RewardsList(
            rewards = uiState.rewards,
            onRewardClick = { reward ->
                if (isParent) {
                    // Edit reward
                } else {
                    // Request redemption
                }
            }
        )
    }
}
```

## Error Handling

### Centralized Error Handling

```kotlin
// In ViewModel base class or extension
fun ViewModel.handleApiError(result: ApiResult.Error): String {
    return when (result.code) {
        401 -> "Session expired. Please log in again."
        403 -> "You don't have permission for this action."
        404 -> "Item not found."
        429 -> "Too many requests. Please wait."
        in 500..599 -> "Server error. Please try again later."
        else -> result.message
    }
}
```

### Network Error Screen

```kotlin
@Composable
fun ErrorMessage(
    message: String,
    onRetry: () -> Unit,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier.fillMaxSize(),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Icon(
            imageVector = Icons.Default.ErrorOutline,
            contentDescription = null,
            modifier = Modifier.size(64.dp),
            tint = MaterialTheme.colorScheme.error
        )
        Spacer(Modifier.height(16.dp))
        Text(
            text = message,
            style = MaterialTheme.typography.bodyLarge,
            textAlign = TextAlign.Center
        )
        Spacer(Modifier.height(24.dp))
        Button(onClick = onRetry) {
            Text("Retry")
        }
    }
}
```

## Testing Strategy

### Unit Tests
- ViewModels with MockK
- Repositories with fake implementations
- Use cases with mocked dependencies

### UI Tests
- Compose testing with `createComposeRule()`
- Screenshot testing for visual regression
- Navigation tests

### Example ViewModel Test

```kotlin
@OptIn(ExperimentalCoroutinesApi::class)
class ChoresViewModelTest {

    @get:Rule
    val mainDispatcherRule = MainDispatcherRule()

    private lateinit var viewModel: ChoresViewModel
    private val mockRepository: ChoreRepository = mockk()
    private val mockSessionManager: SessionManager = mockk()

    @Before
    fun setup() {
        every { mockSessionManager.getCurrentMemberId() } returns "member-1"
        viewModel = ChoresViewModel(mockRepository, mockSessionManager)
    }

    @Test
    fun `loadChores success updates state`() = runTest {
        // Given
        val chores = listOf(Chore(id = "1", title = "Test Chore"))
        coEvery { mockRepository.getChores() } returns ApiResult.Success(chores)

        // When
        viewModel.loadChores()

        // Then
        val state = viewModel.uiState.value
        assertFalse(state.isLoading)
        assertEquals(chores, state.chores)
        assertNull(state.error)
    }

    @Test
    fun `completeChore emits success event`() = runTest {
        // Given
        coEvery { mockRepository.completeChore(any(), any()) } returns
            ApiResult.Success(ChoreCompletionResponse(pointsAwarded = 10))
        coEvery { mockRepository.getChores() } returns ApiResult.Success(emptyList())

        // When/Then
        viewModel.events.test {
            viewModel.completeChore("chore-1")
            val event = awaitItem()
            assertTrue(event is ChoresEvent.ChoreCompleted)
            assertEquals(10, (event as ChoresEvent.ChoreCompleted).points)
        }
    }
}
```
